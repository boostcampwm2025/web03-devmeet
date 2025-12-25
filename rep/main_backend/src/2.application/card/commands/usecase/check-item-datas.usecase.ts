import { Injectable } from "@nestjs/common";
import { CheckCardItemDatasUrlProps } from "../dto";
import { SelectDataFromCache } from "@app/ports/cache/cache.inbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { NotAllowUpdateDataToCache, NotAllowUpdateDataToDb, NotAllowUploadDataToCheck, NotFoundCardItemAssetKeyName } from "@error/application/card/card.error";
import { CheckUploadDatasFromDisk } from "@app/ports/disk/disk.inbound";
import { UpdateValueToDb } from "@app/ports/db/db.outbound";
import { InsertDataToCache, UpdateDataToCache } from "@app/ports/cache/cache.outbound";
import { CardItemAssetProps, cardItemAssetStatusList } from "@domain/card/vo";
import { InsertCardAssetDataProps } from "./uploading-card-item.usecase";
import { PathMapping } from "@domain/shared";
import { CompleteUploadFileToDisk } from "@/2.application/ports/disk/disk.outbound";


type CheckCarItemDatasUsecaseValues = {
  cardAssetNamespace : string;
  itemIdKeyName : string;
  itemIdAttribute : string;  
  statusColName : string;
  statusKeyName : string;
};

type CheckCardItemDatasUsecaseProps<T, ET, DT> = {
  usecaseValues : CheckCarItemDatasUsecaseValues;
  selectCardAssetFromCache : SelectDataFromCache<T>; // cache 
  selectCardAssetFromDb : SelectDataFromDb<ET>;  // db
  insertCardAssetToCache : InsertDataToCache<T>; // 데이터가 없을때 저장할 캐싱
  pathMapping : PathMapping // path를 만들어준다. 
  checkUploadFromDisk : CheckUploadDatasFromDisk<DT>;
  completeUploadToDisk : CompleteUploadFileToDisk<DT>; // 조각난 upload 파일을 다시 모아주는 로직 -> 다시 검증
  updateCardAssetToDb : UpdateValueToDb<ET>; // db upadate
  updateCardAssetToCache : UpdateDataToCache<T>; // cache update
};

@Injectable()
export class CheckCardItemDatasUsecase<T, ET, DT> {

  private readonly usecaseValues : CheckCardItemDatasUsecaseProps<T, ET, DT>["usecaseValues"];
  private readonly selectCardAssetFromCache : CheckCardItemDatasUsecaseProps<T, ET, DT>["selectCardAssetFromCache"];
  private readonly selectCardAssetFromDb : CheckCardItemDatasUsecaseProps<T, ET, DT>["selectCardAssetFromDb"];
  private readonly insertCardAssetToCache : CheckCardItemDatasUsecaseProps<T, ET, DT>["insertCardAssetToCache"];
  private readonly pathMapping : CheckCardItemDatasUsecaseProps<T, ET, DT>["pathMapping"];
  private readonly checkUploadFromDisk : CheckCardItemDatasUsecaseProps<T, ET, DT>["checkUploadFromDisk"];
  private readonly completeUploadToDisk : CheckCardItemDatasUsecaseProps<T, ET, DT>["completeUploadToDisk"];
  private readonly updateCardAssetToDb : CheckCardItemDatasUsecaseProps<T, ET, DT>["updateCardAssetToDb"];
  private readonly updateCardAssetToCache : CheckCardItemDatasUsecaseProps<T, ET, DT>["updateCardAssetToCache"];

  constructor({ 
    usecaseValues, selectCardAssetFromCache, selectCardAssetFromDb, insertCardAssetToCache, pathMapping, checkUploadFromDisk, completeUploadToDisk, updateCardAssetToDb, updateCardAssetToCache
  } : CheckCardItemDatasUsecaseProps<T, ET, DT>) {
    this.usecaseValues = usecaseValues;
    this.selectCardAssetFromCache = selectCardAssetFromCache;
    this.selectCardAssetFromDb = selectCardAssetFromDb;
    this.insertCardAssetToCache = insertCardAssetToCache;
    this.pathMapping = pathMapping;
    this.checkUploadFromDisk = checkUploadFromDisk;
    this.completeUploadToDisk = completeUploadToDisk;
    this.updateCardAssetToDb = updateCardAssetToDb;
    this.updateCardAssetToCache = updateCardAssetToCache;
  }

  async execute( dto : CheckCardItemDatasUrlProps ) : Promise<void> {

    // 1. 데이터 찾기 ( cache 확인 -> db 확인 )
    let filePath : string | undefined;
    let cardAsset : Required<CardItemAssetProps> | undefined;

    const namespace : string = `${this.usecaseValues.cardAssetNamespace}:${dto.card_id}:${dto.item_id}`.trim();
    cardAsset = await this.selectCardAssetFromCache.select({ 
      namespace,
      keyName : this.usecaseValues.itemIdKeyName
    });

    // cache에 없다면 db에서 찾기 + cache 저장
    if ( !cardAsset ) {
      cardAsset = await this.selectCardAssetFromDb.select({ attributeName : this.usecaseValues.itemIdAttribute, attributeValue : dto.item_id });
      if ( !cardAsset ) throw new NotFoundCardItemAssetKeyName();
      
      // asset 캐시 정보 저장
      const insertAsset : InsertCardAssetDataProps = {
        cardAsset, upload_id : dto.upload_id
      }
      await this.insertCardAssetToCache.insert(insertAsset);
    }

    // file의 주소 생성
    filePath = this.pathMapping.mapping(
      [
        cardAsset.card_id,
        cardAsset.item_id,
        cardAsset.key_name
      ]
    );
    if (!filePath) throw new NotFoundCardItemAssetKeyName(); 

    // 2. 검증 
    const checked : boolean = await this.checkUploadFromDisk.checks({ pathName : filePath, upload_id : dto.upload_id, tags : dto.tags }); // 여기 안에서 문제가 발생하면 어디가 문제 였는지 이야기 해주면 될 것 같다. 
    if ( !checked ) throw new NotAllowUploadDataToCheck(undefined);

    // 3. 결합
    await this.completeUploadToDisk.complete({ pathName : filePath, upload_id : dto.upload_id, size : cardAsset.size });

    // 4. 변경 ( db, cache )
    const updateChecked : boolean = await this.updateCardAssetToDb.update({ uniqueValue : dto.item_id, updateColName : this.usecaseValues.statusColName, updateValue : cardItemAssetStatusList[1] }); // 상태를 변경해주면 되기 때문에
    if ( !updateChecked ) throw new NotAllowUpdateDataToDb();

    const updateCacheChecked : boolean = await this.updateCardAssetToCache.updateKey({ namespace, keyName : this.usecaseValues.statusKeyName, updateValue : cardItemAssetStatusList[1] }); // 마찬가지 상태를 변경해주면 된다. 
    if ( !updateCacheChecked ) throw new NotAllowUpdateDataToCache();

    return;
  };

};