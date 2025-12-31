

type CardStatusProps = 'published' | 'draft' | 'archived';

type CardUserProps = {
  user_id : string;
  nickname : string;
  email : string;
  profile_path : string | null;
};

type CardStatProps = {
  like_count : number;
  view_count : number;
};

export type CardDataProps = {
  card_id: string;
  category_id: number;
  thumbnail_path: string | null;
  status: CardStatusProps;
  title: string;
  created_at: Date;
  updated_at: Date;

  // 유저 정보
  user : CardUserProps;

  // 조회수 and like 정보
  stat : CardStatProps;
};

export type CardListDataProps = Record<string, Array<CardDataProps>>; // type : card_data