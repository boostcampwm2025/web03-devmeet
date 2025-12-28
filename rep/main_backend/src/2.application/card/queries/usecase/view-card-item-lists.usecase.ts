import { GetUploadUrlsFromDisk } from "@app/ports/disk/disk.inbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { Injectable } from "@nestjs/common";


type GetCardItemDatasUsecaseProps<T, ET> = {
  selectCardItems : SelectDataFromDb<T>; // 모든 card_item 데이터를 db에서 찾아야 한다. 
  getUploadUrlsFromDisk : GetUploadUrlsFromDisk<ET> // 모든 upload_url을 가져와야 한다. 
};

@Injectable()
export class GetCardItemDatasUsecase<T, ET> {

  private readonly selectCardItems : GetCardItemDatasUsecaseProps<T, ET>["selectCardItems"];
  private readonly getUploadUrlsFromDisk : GetCardItemDatasUsecaseProps<T, ET>["getUploadUrlsFromDisk"];

  constructor({
    selectCardItems, getUploadUrlsFromDisk
  } : GetCardItemDatasUsecaseProps<T, ET>) {
    this.selectCardItems = selectCardItems;
    this.getUploadUrlsFromDisk = getUploadUrlsFromDisk;
  }

  async execute(card_id : string) {

    // 1. db에서 해당 card_id에 모든 card_item and card_asset을 가져온다. 

    // 2. 해당 card_item_asset에 url을 upload_url로 변환시켜야 한다. ( 이걸 cache로 찾는건 고려할만 한 것 같다. ) 

  }

};