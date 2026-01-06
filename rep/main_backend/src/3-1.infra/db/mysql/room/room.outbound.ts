import { DeleteValueToDb, InsertValueToDb } from "@app/ports/db/db.outbound";
import { Inject, Injectable } from "@nestjs/common";
import { ResultSetHeader, type Pool } from "mysql2/promise";
import { DB_ROOMS_ATTRIBUTE_NAME, DB_TABLE_NAME, MYSQL_DB } from "../../db.constants";
import { RoomProps } from "@domain/room/vo";


// mysql에 room에 대한 데이터 저장
@Injectable()
export class InsertRoomDataToMysql extends InsertValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };

  private async insertData({
    db, tableName, entity
  } : {
    db : Pool, tableName : string, entity: Required<RoomProps>
  }) : Promise<boolean> {

    const sql : string = `
    INSERT INTO \`${tableName}\`(
    \`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.CODE}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.TITLE}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.PASSWORD_HASH}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.OWNER_USER_ID}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.MAX_PARTICIPANTS}\`,
    \`${DB_ROOMS_ATTRIBUTE_NAME.STATUS}\`)
    VALUES (UUID_TO_BIN(?, true), ?, ?, ?, UUID_TO_BIN(?, true), ?, ?)
    `;
    const values : Array<any> = [
      entity.room_id,
      entity.code,
      entity.title,
      entity.password_hash,
      entity.owner_user_id,
      entity.max_participants,
      entity.status
    ];

    const [ result ] = await db.execute<ResultSetHeader>(sql, values)

    return result && result.affectedRows ? true : false;
  };

  async insert(entity: Required<RoomProps>): Promise<boolean> {
    
    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.ROOMS;

    const inserted : boolean = await this.insertData({ db, tableName, entity });

    return inserted;
  };
};

@Injectable()
export class DeleteRoomDataToMysql extends DeleteValueToDb<Pool> {

  constructor(
    @Inject(MYSQL_DB) db : Pool,
  ) { super(db); };

  private async deleteData({
    db, tableName, uniqueValue
  } : {
    db : Pool, tableName : string , uniqueValue : string
  }) : Promise<boolean> {

    const sql : string = `
    DELETE FROM \`${tableName}\`
    WHERE \`${DB_ROOMS_ATTRIBUTE_NAME.ROOM_ID}\` = UUID_TO_BIN(?, true)
    `;

    const [ result ] = await db.execute<ResultSetHeader>(sql, [ uniqueValue ]);

    return result && result.affectedRows ? true : false;
  };

  // room_id가 uniqueValue
  async delete({ uniqueValue, addOption }: { uniqueValue: string; addOption: undefined; }): Promise<boolean> {
    
    const db : Pool = this.db;
    const tableName : string = DB_TABLE_NAME.ROOMS;

    await this.deleteData({ db, tableName, uniqueValue });

    return true;
  };
};