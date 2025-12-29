import { GetUploadUrlsFromDisk } from "@app/ports/disk/disk.inbound";
import { SelectDataFromDb } from "@app/ports/db/db.inbound";
import { Injectable } from "@nestjs/common";
import { CardItemAssetProps, CardItemProps } from "@domain/card/vo";
import { DontGetCardItemAndAssetData } from "@error/application/card/card.error";
import { CardItemAndAssetViewReturnDto } from "../dto";
import { UpdateDataToCache } from "@app/ports/cache/cache.outbound";
import { UpdateValueToDb } from "@app/ports/db/db.outbound";


type GetCardItemDatasUsecaseValues = {
  cardIdAttribute : string;
  cardNamespace : string;
  cardViewCountAttribute : string; // 나중에 like_count까지 확장가능
  cardViewCountKeyName : string; // 나중에 like_count까지 확장가능 -> cache도 마찬가지
};

type GetCardItemDatasUsecaseProps<T, CT, ET> = {
  usecaseValues : GetCardItemDatasUsecaseValues; // card_id에 대한 데이터 이름
  selectCardItems : SelectDataFromDb<T>; // 모든 card_item 데이터를 db에서 찾아야 한다. 
  getUploadUrlsFromDisk : GetUploadUrlsFromDisk<ET>; // 모든 upload_url을 가져와야 한다.
  updateCardStatToDb : UpdateValueToDb<T>;
  updateCardStatToCache : UpdateDataToCache<CT>; // card_stat에 대해서 cache 수정
};

export type ViewCardItemAndAssetListsType = {
  card_items : CardItemProps;
  card_assets : CardItemAssetProps | undefined;
}; // 우리가 card_item, card_asset을 받게 된다.

@Injectable()
export class GetCardItemDatasUsecase<T, CT, ET> {

  private readonly usecaseValues : GetCardItemDatasUsecaseProps<T, CT, ET> ["usecaseValues"];
  private readonly selectCardItems : GetCardItemDatasUsecaseProps<T, CT, ET>["selectCardItems"];
  private readonly getUploadUrlsFromDisk : GetCardItemDatasUsecaseProps<T, CT, ET>["getUploadUrlsFromDisk"];
  private readonly updateCardStatToDb : GetCardItemDatasUsecaseProps<T, CT, ET>["updateCardStatToDb"];
  private readonly updateCardStatToCache : GetCardItemDatasUsecaseProps<T, CT, ET>["updateCardStatToCache"];

  constructor({
    usecaseValues, selectCardItems, getUploadUrlsFromDisk, updateCardStatToDb, updateCardStatToCache
  } : GetCardItemDatasUsecaseProps<T, CT, ET>) {
    this.usecaseValues = usecaseValues;
    this.selectCardItems = selectCardItems;
    this.getUploadUrlsFromDisk = getUploadUrlsFromDisk;
    this.updateCardStatToDb = updateCardStatToDb;
    this.updateCardStatToCache = updateCardStatToCache;
  }

  async execute(card_id : string) : Promise<Array<CardItemAndAssetViewReturnDto>> {

    // 1. db에서 해당 card_id에 모든 card_item and card_asset을 가져온다. 
    const cardItemAndAsset : Array<ViewCardItemAndAssetListsType> | undefined = await this.selectCardItems.select({ 
      attributeName : this.usecaseValues.cardIdAttribute, 
      attributeValue : card_id });

    if ( !cardItemAndAsset ) throw new DontGetCardItemAndAssetData();

    // 2. 해당 card_item_asset에 url을 upload_url로 변환시켜야 한다. -> card_item중 card_asset이 존재하면 이를 이용해서 upload_url로 변환시켜야 한다. 
    const completeCheckData : Array<CardItemAndAssetViewReturnDto> = [];
    const loadingData = new Map<string, CardItemAndAssetViewReturnDto>();
    const urls : Array<{ uniqueKey : string, pathName : string, mime_type : string }> = [];
    cardItemAndAsset.forEach((cardInfo : ViewCardItemAndAssetListsType) => {
      if ( !cardInfo.card_assets ) {
        completeCheckData.push({
          ...cardInfo.card_items,
          type : cardInfo.card_items.type as "text" | "video" | "image",
          card_asset : null
        });
      } else {
        loadingData.set(cardInfo.card_items.item_id, {
          ...cardInfo.card_items,
          type : cardInfo.card_items.type as "text" | "video" | "image",
          card_asset : {
            item_id : cardInfo.card_items.item_id,
            path : "",
            status : cardInfo.card_assets.status
          }
        });
        urls.push({
          uniqueKey : cardInfo.card_assets.item_id,
          pathName : `${cardInfo.card_assets.card_id}/${cardInfo.card_assets.item_id}/${cardInfo.card_assets.key_name}`,
          mime_type : cardInfo.card_assets.mime_type
        });
      };
    });

    const urlDatas : Record<string, any> = await this.getUploadUrlsFromDisk.getUrls(urls); 
    // loading_data에 upload_url에 값을 채워 넣는다. 
    for ( const [ item_id, dto ] of loadingData.entries() ) {
      const upload_url = urlDatas[item_id];
      
      // 아직 업로드가 안된것일수 있음
      if ( !upload_url ) continue;

      // 업로드 된건 주입 
      if (dto.card_asset) dto.card_asset.path = upload_url; 
    };

    // 조회수 올리기 -> 아예 여기서 속도가 좀 느려지더라도 명확하게 하자 
    await this.updateCardStatToDb.update({ uniqueValue : card_id, updateColName : this.usecaseValues.cardViewCountAttribute, updateValue : 1 }); // card_stat에 값 변경
    const namespace : string = `${this.usecaseValues.cardNamespace}:${card_id}`;
    await this.updateCardStatToCache.updateKey({ namespace, keyName : this.usecaseValues.cardViewCountKeyName, updateValue : 1 }); // cache에서 card 정보 변경

    return [
      ...completeCheckData,
      ...Array.from(loadingData.values())
    ]
  }

};