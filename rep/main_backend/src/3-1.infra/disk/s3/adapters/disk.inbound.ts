import { CheckUploadDataFromDisk, GetMultiPartUploadUrlFromDisk, GetMultiPartVerGroupIdFromDisk, GetUploadUrlFromDisk } from "@app/ports/disk/disk.inbound";
import { CreateMultipartUploadCommand, HeadObjectCommand, PutObjectCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Inject, Injectable } from "@nestjs/common";
import { S3_DISK } from "../../disk.constants";
import { ConfigService } from "@nestjs/config";
import path from "path";
import { GetUrlTypes } from "@app/card/queries/dto";
import { DiskError } from "@error/infra/card/card.error";


@Injectable()
export class GetPresignedUrlFromS3Bucket extends GetUploadUrlFromDisk<S3Client> {
  
  // 받아오기 
  constructor( 
    @Inject(S3_DISK) disk : S3Client,
    private readonly config : ConfigService
  ) {
    super(disk);
  }

  // path의 옵션은 card_id/item_id/filename
  async getUrl({ pathName, mime_type } : { pathName: Array<string>; mime_type: string; }): Promise<string> {
    
    // 설정
    const key_name : string = path.posix.join(...pathName); // os와 상관없이 규칙을 /로 통일
    const Bucket : string = this.config.get<string>("NODE_APP_AWS_BUCKET_NAME", "bucket_name");
    const expiresIn : number = this.config.get<number>("NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC", 180);

    const command = new PutObjectCommand({
      Bucket,
      Key : key_name,
      ContentType : mime_type
    });

    // url 요청
    const uploadUrl = await getSignedUrl(this.disk, command, {
      expiresIn
    });

    return uploadUrl;
  }
};

// upload_id 를 가져오고 그에 따라서 
@Injectable()
export class GetMultipartUploadIdFromS3Bucket extends GetMultiPartVerGroupIdFromDisk<S3Client> {

  constructor(
    @Inject(S3_DISK) disk : S3Client,
    private readonly config : ConfigService
  ) { super(disk); };

  async getMultiId({ pathName, mime_type }: { pathName: Array<string>; mime_type: string; }): Promise<string> {

    const key_name : string = path.posix.join(...pathName); // os와 상관없이 규칙을 /로 통일
    const Bucket : string = this.config.get<string>("NODE_APP_AWS_BUCKET_NAME", "bucket_name");

    const command = new CreateMultipartUploadCommand({
      Bucket,
      Key : key_name,
      ContentType : mime_type
    });

    const res = await this.disk.send(command);

    return res.UploadId!;
  };
};

// upload_id에 따라서 presigned_url을 제공
@Injectable()
export class GetPresignedUrlsFromS3Bucket extends GetMultiPartUploadUrlFromDisk<S3Client> {

  constructor(
    @Inject(S3_DISK) disk : S3Client,
    private readonly config : ConfigService
  ) { super(disk); };

  async getUrls({ upload_id, pathName, partNumbers }: { upload_id: string; pathName: string; partNumbers: Array<number>; }): Promise<Array<GetUrlTypes>> {
    
    const Bucket : string = this.config.get<string>("NODE_APP_AWS_BUCKET_NAME", "bucket_name");
    const expiresIn : number = this.config.get<number>("NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC", 180);

    return Promise.all(
      partNumbers.map(async (partNumber : number) => {
        const command = new UploadPartCommand({
          Bucket,
          Key : pathName,
          UploadId : upload_id,
          PartNumber : partNumber
        });

        const upload_url : string = await getSignedUrl(this.disk, command, { expiresIn });

        return { upload_url, part_number : partNumber };
    })
  );
  }
};

@Injectable()
export class CheckPresignedUrlFromAwsS3 extends CheckUploadDataFromDisk<S3Client> {

  constructor(
    @Inject(S3_DISK) disk : S3Client,
    private readonly config : ConfigService
  ) { super(disk); };

  async check({ pathName, etag }: { pathName: string; etag: string; }): Promise<boolean> {
    
    const Bucket : string = this.config.get<string>("NODE_APP_AWS_BUCKET_NAME", "bucket");
    
    try {
      const result = await this.disk.send(
        new HeadObjectCommand({
          Bucket,
          Key : pathName
        })
      );
      if ( !result.ETag ) return false;

      // 보통 s3에는 "" 이런식으로 가져온다고 한다.
      const s3Etag = result.ETag.replace(/"/g, '');
      const inputEtag = etag.replace(/"/g, '');

      // 같으면 맞고 아니면 에러
      return s3Etag === inputEtag;
    } catch (err) {
      throw new DiskError(err);
    };
  };
};
