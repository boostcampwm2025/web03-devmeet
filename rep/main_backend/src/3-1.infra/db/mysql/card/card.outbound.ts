import { InsertValueToDb } from "@app/ports/db/db.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { ResultSetHeader, type Pool } from "mysql2/promise";
import { DB_CARD_ITEMS_ATTRIBUTE_NAME, DB_CARD_STATS_ATTRIBUTE_NAME, DB_CARDS_ATTRIBUTE_NAME, DB_TABLE_NAME, MYSQL_DB } from "../../db.constants";
import { InsertCardAndCardStateDataProps } from "@app/card/commands/usecase";
import { DatabaseError } from "@error/infra/infra.error";
import { CardItemProps } from "@domain/card/vo";
import { NotFoundRefereceError } from "@error/infra/card/card.error";


@Injectable()
export class InsertCardAndCardStateDataToMysql extends InsertValueToDb<Pool> {
  
  constructor(@Inject(MYSQL_DB) db : Pool ) { super(db); };

  private async insertData({
    db, entity
  } : {
    db : Pool, entity : InsertCardAndCardStateDataProps
  }) : Promise<boolean> {

    const connect = await db.getConnection();

    try {

      await connect.beginTransaction();

      // card 저장
      const cardTableName : string = DB_TABLE_NAME.CARDS;
      const cardSql : string = `
      INSERT INTO \`${cardTableName}\`(
      \`${DB_CARDS_ATTRIBUTE_NAME.CARD_ID}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.USER_ID}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.CATEGORY_ID}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.STATUS}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.TITLE}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_WIDTH}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.WORKSPACE_HEIGHT}\`,
      \`${DB_CARDS_ATTRIBUTE_NAME.BACKGROUND_COLOR}\`
      )
      VALUES (UUID_TO_BIN(?, true), UUID_TO_BIN(?, true), ?, ?, ?, ?, ?, ?)
      `;

      const cardData = entity.card;
      const [ cardInsert ] = await connect.query<ResultSetHeader>(cardSql, [ 
        cardData.card_id, 
        cardData.user_id, 
        cardData.category_id, 
        cardData.status,
        cardData.title,
        cardData.workspace_width,
        cardData.workspace_height,
        cardData.background_color
      ]);

      // card_stat 저장
      const cardStatTableName : string = DB_TABLE_NAME.CARD_STATS;
      const cardStatSql : string = `
      INSERT INTO \`${cardStatTableName}\`(
      \`${DB_CARD_STATS_ATTRIBUTE_NAME.CARD_ID}\`
      )
      VALUES (UUID_TO_BIN(?, true))
      `;

      const cardStat = entity.cardState;
      const [ cardStatInsert ] = await connect.query<ResultSetHeader>(cardStatSql, [ cardStat.card_id ]);
 
      await connect.commit();

      return cardInsert && cardInsert.affectedRows && cardStatInsert && cardStatInsert.affectedRows ? true : false;
    } catch (err) {
      if ( connect ) await connect.rollback();
      throw new DatabaseError(err);
    } finally {
      if ( connect ) connect.release();
    };

  };

  public async insert(entity: InsertCardAndCardStateDataProps): Promise<boolean> {
    
    const db = this.db;

    const insertChecked : boolean = await this.insertData({ db, entity });

    return insertChecked;
  };

};

@Injectable()
export class InsertCardItemDataToMysql extends InsertValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool
  ) { super(db); };

  // 데이터를 insert 하는데 필요한 내부 함수
  private async insertData({
    db, tableName, entity
  } : {
    db : Pool, tableName : string, entity : Required<CardItemProps>
  }) : Promise<boolean> {

    const columns : Array<string> = [
      DB_CARD_ITEMS_ATTRIBUTE_NAME.ITEM_ID,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.CARD_ID,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.TYPE,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.X,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.Y,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.WIDTH,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.ROTATION,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_X,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.SCALE_Y,
      DB_CARD_ITEMS_ATTRIBUTE_NAME.OPTION
    ];

    const values : Array<any> = [
      entity.item_id,
      entity.card_id,
      entity.type,
      entity.x,
      entity.y,
      entity.width,
      entity.rotation,
      entity.scale_x,
      entity.scale_y,
      entity.option,
    ];

    const optional: Array<[string, any]> = [
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.HEIGHT, entity.height],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.OPACITY, entity.opacity],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.Z_INDEX, entity.z_index],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_LOCKED, entity.is_locked],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.IS_VISIBLE, entity.is_visible],
      [DB_CARD_ITEMS_ATTRIBUTE_NAME.NAME, entity.name],
    ];

    optional.forEach(([ col, val ]) => {
      if ( val !== undefined ) {
        columns.push(col);
        values.push(val);
      };
    });

    const colSql = columns.map((c) => `\`${c}\``).join(", ");
    const placeholders = columns.map(() => "?").join(", ");

    try {
      const sql : string = `INSERT INTO \`${tableName}\` (${colSql}) VALUES (${placeholders})`;

      const [ result ] = await db.query<ResultSetHeader>(sql, values);
      return result?.affectedRows ? true : false;
    } catch (err) {
      if ( err?.code === "ER_NO_REFERENCED_ROW_2" || err?.errno === 1452 ) {
        throw new NotFoundRefereceError("card_id를 찾을 수 없습니다. 다시 확인해주세요");
      }
      throw new DatabaseError(err);
    };
  };

  // card_item을 insert 하는데 필요한 함수 
  public async insert(entity: Required<CardItemProps>): Promise<boolean> {
    
    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.CARD_ITEMS;

    const insertChecked : boolean = await this.insertData({ db, tableName, entity });

    return insertChecked;
  };

};

