import { cardItemTextAlignVo, cardItemTextFillVo, cardItemTextFontFamilyVo, cardItemTextFontSizeVo, cardItemTextFontStyleVo, CardItemTextProps, cardItemTextTextDecorationVo, cardItemTextTextVo, cardItemTextWrapVo, itemIdVo } from "@domain/card/vo";


export class CardItemText {
  private readonly item_id : CardItemTextProps["item_id"];
  private readonly text : CardItemTextProps["text"];
  private readonly font_size : CardItemTextProps["font_size"];
  private readonly font_family : CardItemTextProps["font_family"];
  private readonly fill : CardItemTextProps["fill"];
  private readonly font_style : CardItemTextProps["font_style"];
  private readonly text_decoration : CardItemTextProps["text_decoration"];
  private readonly align : CardItemTextProps["align"];
  private readonly wrap : CardItemTextProps["wrap"];
  private readonly created_at : Exclude<CardItemTextProps["created_at"], undefined>;
  private readonly updated_at : Exclude<CardItemTextProps["updated_at"], undefined>;

  constructor({
    item_id, text, font_size, font_family, fill, font_style, text_decoration, align, wrap, created_at = new Date(), updated_at = new Date()
  } : CardItemTextProps) {
    this.item_id = itemIdVo(item_id);
    this.text = cardItemTextTextVo(text);
    this.font_size = cardItemTextFontSizeVo(font_size);
    this.font_family = cardItemTextFontFamilyVo(font_family);
    this.fill = cardItemTextFillVo(fill);
    this.font_style = cardItemTextFontStyleVo(font_style);
    this.text_decoration = cardItemTextTextDecorationVo(text_decoration);
    this.align = cardItemTextAlignVo(align);
    this.wrap = cardItemTextWrapVo(wrap);
    this.created_at = created_at && created_at instanceof Date ? created_at : new Date();
    this.updated_at = updated_at && updated_at instanceof Date ? updated_at : new Date();

    Object.freeze(this);
  };

  getItemId() : CardItemTextProps["item_id"] { return this.item_id; };
  getText() : CardItemTextProps["text"] { return this.text; };
  getFontSize() : CardItemTextProps["font_size"] { return this.font_size; };
  getFontFamily() : CardItemTextProps["font_family"] { return this.font_family; };
  getFill() : CardItemTextProps["fill"] { return this.fill; };
  getFontStyle() : CardItemTextProps["font_style"] { return this.font_style; };
  getTextDecoration() : CardItemTextProps["text_decoration"] { return this.text_decoration; };
  getAlign() : CardItemTextProps["align"] { return this.align; };
  getWrap() : CardItemTextProps["wrap"] { return this.wrap; };
  getCreatedAt() : CardItemTextProps["created_at"] { return this.created_at; };
  getUpdatedAt() : CardItemTextProps["updated_at"] { return this.updated_at; };

  getData() : Required<CardItemTextProps> {
    return {
      item_id : this.item_id,
      text : this.text,
      font_size : this.font_size,
      font_family : this.font_family,
      fill : this.fill,
      font_style : this.font_style,
      text_decoration : this.text_decoration,
      align : this.align,
      wrap : this.wrap,
      created_at : this.created_at,
      updated_at : this.updated_at
    };
  };

};