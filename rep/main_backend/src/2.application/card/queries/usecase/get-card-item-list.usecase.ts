// 이 부분이 많이 고민 이었다. -> 실시간을 사용한다면 이 usecase를 사용하기는 할 것이다. 
import { SelectDatasFromCache } from "@app/ports/cache/cache.inbound";
import { SelectDataFromDb, SelectDatasFromDb } from "@app/ports/db/db.inbound";
import { Injectable } from "@nestjs/common";
import { GetCardItemListsDto, ReturnCardDataDto, ReturnCardItemListsDto } from "../dto/get-card-item-list.dto";
import { InsertDataToCache } from "@app/ports/cache/cache.outbound";
import { CardItemAssetProps, CardItemProps } from "@domain/card/vo";
import { DontGetCardItemAndAssetData } from "@error/application/card/card.error";
import { GetUploadUrlsFromDisk } from "@app/ports/disk/disk.inbound";


type GetCardItemListUsecaseValues = {
  cardItemNamespace : string;
  cardAssetNamespace : string;
  itemIdKeyName : string;
  cardIdAttribute : string;
  itemIdAttribute : string;
};

type GetCardItemListUsecaseProps<DT, CT, T> = {
  usecaseValues : GetCardItemListUsecaseValues
  selectAllCardItemAndAssetFromDb : SelectDataFromDb<DT>; // 모든 card_id에 해당하는 데이터를 가져온다. - db 사용
  selectCardItemAndAssetFromCache : SelectDatasFromCache<CT>; // card_id를 이용해서 해당 card_item, card_item_asset을 가져옴 - cache 사용
  selectCardItemAndAssetFromDb : SelectDatasFromDb<DT>; // card_id를 이용해서 해당 card_item, card_item_asset을 가져옴 - db 사용
  insertCardItemAndAssetToCache : InsertDataToCache<CT>; // 해당하는 값을 cache에서 못찾으면 db에서 찾고 해당 값을 cache에 대입
  getUploadUrlsFromDisk : GetUploadUrlsFromDisk<T>
};

// 가져온 값이 가져야 할 타입
export type GetCardItemAndAssetListsType = {
  card_items : CardItemProps;
  card_assets : CardItemAssetProps | undefined;
};

// card_item 리스트를 가져올 수 있게 해주는 usecase
@Injectable()
export class GetCardItemListUsecase<DT, CT, T> {

  private readonly usecaseValues : GetCardItemListUsecaseProps<DT, CT, T>["usecaseValues"];
  private readonly selectAllCardItemAndAssetFromDb : GetCardItemListUsecaseProps<DT, CT, T>["selectAllCardItemAndAssetFromDb"];
  private readonly selectCardItemAndAssetFromCache : GetCardItemListUsecaseProps<DT, CT, T>["selectCardItemAndAssetFromCache"];
  private readonly selectCardItemAndAssetFromDb : GetCardItemListUsecaseProps<DT, CT, T>["selectCardItemAndAssetFromDb"];
  private readonly insertCardItemAndAssetToCache : GetCardItemListUsecaseProps<DT, CT, T>["insertCardItemAndAssetToCache"];
  private readonly getUploadUrlsFromDisk :  GetCardItemListUsecaseProps<DT, CT, T>["getUploadUrlsFromDisk"];

  constructor({
    usecaseValues, selectAllCardItemAndAssetFromDb, selectCardItemAndAssetFromCache, selectCardItemAndAssetFromDb, insertCardItemAndAssetToCache, getUploadUrlsFromDisk
  } : GetCardItemListUsecaseProps<DT, CT, T>) {
    this.usecaseValues = usecaseValues;
    this.selectAllCardItemAndAssetFromDb = selectAllCardItemAndAssetFromDb;
    this.selectCardItemAndAssetFromCache = selectCardItemAndAssetFromCache;
    this.selectCardItemAndAssetFromDb = selectCardItemAndAssetFromDb;
    this.insertCardItemAndAssetToCache = insertCardItemAndAssetToCache;
    this.getUploadUrlsFromDisk = getUploadUrlsFromDisk;
  };

  async execute( dto : GetCardItemListsDto ) : Promise<ReturnCardDataDto> {

    let cardInfos : Array<GetCardItemAndAssetListsType> | undefined; // 만약에 아예 못찾으면 undefiend이긴 하다.
    if ( dto.status === "ALL" ) { // 처음에는 조금 느리지만 모든 값을 안전하게 가져오기 위함이다.  
      // 처음 모든 값을 가져올때는 db에서 찾는것이 맞다고 생각한다. -> cache에 몇개는 있고 몇개는 없을 수 도 있기 때문에 여기서 모두 추가해준다. -> 처음에는 느리지만 이를 이용해서 안전하게 가져오려는 속셈이다. 
      cardInfos = await this.selectAllCardItemAndAssetFromDb.select({
        attributeName : this.usecaseValues.cardIdAttribute,
        attributeValue : dto.card_id
      }) 
      
      // 모든값을 cache에 저장한다. -> 안전하게 저장하는 편이 좋다는 판단이다.  
      await this.insertCardItemAndAssetToCache.insert( cardInfos );
    } 
    else if ( dto.status === "RENDER" ) {
      // cache에서 먼저 찾는데 일단 namespace만들기
      const namespaces : Array<string> = dto.item_ids.map( (item_id : string) => `${this.usecaseValues.cardItemNamespace}:${dto.card_id}:${item_id}`); // 해당 item_id에 대해서만 값을 찾는다.  
      cardInfos = await this.selectCardItemAndAssetFromCache.selects({ namespaces }); // card_item에 대한 namespace만 가져왔다 만약 해당 값이 image라면 바로 asset도 가져올 수 있게

      // undefiend는 중간에 값을 찾지 못했을때 주는 오류로 처리할까 고민이다 그런데 cache에서 못찾았다고 에러 처리하는건 아닌것 같고 따로 찾아서 저장하는게 좀 더 합리적이라는 생각을 한다. 
      if ( !cardInfos || (cardInfos && cardInfos.length === 0) ) {
        const attributes : Array<{attributeName: string; attributeValue: any;}> = dto.item_ids.map( (item_id : string) => ({ attributeName : this.usecaseValues.itemIdAttribute, attributeValue : item_id }) )
        cardInfos = await this.selectCardItemAndAssetFromDb.selects(attributes); // 해당 item_id에 해당하는 값을 찾고 그 값을 가져온다. 
        
        await this.insertCardItemAndAssetToCache.insert( cardInfos ); // 그리고 모두 저장한다. 
      }
    }
    else {
      // 바로 반환 고민이 많이 된다. -> 바로 반환
      const cardData : ReturnCardDataDto = {
        card_id : dto.card_id,
        status : dto.status,
        lists : dto.item_ids.map((item_id) => {
          const value : ReturnCardItemListsDto = {
            item_id,
            datas : undefined,
            assets : undefined
          }
          return value;
        })
      };
      return cardData;
    }

    // 조금 다른게 비어있는 리스트는 괜찮다. -> 초반에는 아무 card_item이 없는게 맞으니까, undefiend는 그냥 해당 값이 없을때 줄 예정이다. 
    if ( !cardInfos ) throw new DontGetCardItemAndAssetData(); 

    // 2. asset 즉 파일이 있는경우 presigned_url로 변환한다. ( 보낼값을 고민해봐야 겠다.  ) -> 변경된 값이 무엇인지 알려주는 것도 필요해 보인다 이를 어떻게 하면 좋을까?
    const completeCheckData : Array<ReturnCardItemListsDto> = [];
    const loadingData = new Map<string, ReturnCardItemListsDto>();
    const urls : Array<{ uniqueKey : string, pathName : string, mime_type : string }> = [];
    cardInfos.forEach((cardInfo : GetCardItemAndAssetListsType) => {
      if ( !cardInfo.card_assets ) {
        completeCheckData.push({
          item_id : cardInfo.card_items.item_id,
          datas : {
            ...cardInfo.card_items,
          },
          assets : undefined
        });
      } else {
        loadingData.set(cardInfo.card_items.item_id, {
          item_id : cardInfo.card_items.item_id,
          datas : {
            ...cardInfo.card_items
          },
          assets : {
            upload_url : "",
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

    // assetData의 경우는 upload_url을 발급받는다. item_id : upload_url
    const urlDatas : Record<string, any> = await this.getUploadUrlsFromDisk.getUrls(urls); 
    // 이쪽은 mapping 이다 이걸 ports로 처리할지 고민중이다. 
    for ( const [ item_id, dto ] of loadingData.entries() ) {
      const upload_url = urlDatas[item_id];
      
      // 아직 업로드가 안된것일수 있음
      if ( !upload_url ) continue;

      // 업로드 된건 주입 
      if (dto.assets) dto.assets.upload_url = upload_url; 
    };

    // 3. 반환하기 
    return {
      card_id : dto.card_id,
      status : dto.status,
      lists : [
        ...completeCheckData,
        ...Array.from(loadingData.values())
      ]
    };
  };

};