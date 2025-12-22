import { NotAllowTextAlignType, NotAllowTextFillType } from "@error/domain/card/card.error";
import { NotAllowMaxLengthText, NotAllowMinValue } from "@error/domain/user/user.error";
import { baseVo } from "@domain/shared";


export const cardItemTextAlignList = ['left', 'center', 'right', 'justify'] as const;
export type CardItemTextAlignProps = typeof cardItemTextAlignList[number];

export type CardItemTextProps = {
  item_id : string;
  text : string;
  font_size : number;
  font_family : string;
  fill : string;
  font_style : string;
  text_decoration : string;
  align : CardItemTextAlignProps;
  wrap : string;
  created_at? : Date;
  updated_at? : Date;
};

// text 관련 
export function cardItemTextTextVo( text : CardItemTextProps["text"] ) : string {
  const name : string = "text";

  baseVo({ name, value : text, type : "string" });

  return text;
};

// font_size 관련
export function cardItemTextFontSizeVo( font_size : CardItemTextProps['font_size'] ) : number {
  const name : string = "font_size";

  if ( font_size !== 0 ) baseVo({ name, value : font_size, type : "number" });

  const min : number = 0;
  if ( font_size <= min ) throw new NotAllowMinValue({ name, min });

  return font_size;
};

// font_family 관련
export function cardItemTextFontFamilyVo( font_family : CardItemTextProps["font_family"] ) : string {
  const name : string = "font_family";

  baseVo({ name, value : font_family, type : "string" });
  font_family = font_family.trim();

  const length : number = 100;
  if ( font_family.length > length ) throw new NotAllowMaxLengthText({ name, length });

  return font_family;
};

// fill 관련 
const fillRegxp : Array<RegExp> = [
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\)$/
];
export function cardItemTextFillVo( fill : CardItemTextProps["fill"] ) : string {
  const name : string = "fill";

  baseVo({ name, value : fill, type : "string" });
  fill = fill.trim();

  let fillChecked : boolean = false;
  for ( const fillexp of fillRegxp ) {
    if ( fillexp.test(fill) ) {
      fillChecked = true;
      break;
    };
  };
  if ( !fillChecked ) throw new NotAllowTextFillType();

  return fill;
};

// font_style 관련 
export function cardItemTextFontStyleVo( font_style : CardItemTextProps["font_style"] ) : string {
  const name : string = "font_style";

  baseVo({ name, value : font_style, type : "string" });
  font_style = font_style.trim();

  const length : number = 100;
  if ( font_style.length > length ) throw new NotAllowMaxLengthText({ name, length });

  return font_style;
};

// text_decoration 관련
export function cardItemTextTextDecorationVo( text_decoration : CardItemTextProps["text_decoration"] ) : string {
  const name : string = "text_decoration";

  baseVo({ name, value : text_decoration, type : "string" });
  text_decoration = text_decoration.trim();

  const length : number = 100;
  if ( text_decoration.length > length ) throw new NotAllowMaxLengthText({ name, length });  

  return text_decoration;
};

// align 관련
export function cardItemTextAlignVo( align : CardItemTextProps['align'] ) : CardItemTextAlignProps {
  const name : string = "align";

  baseVo({ name, value : align, type : "string" });
  align = (align.trim() as any );

  if ( !cardItemTextAlignList.includes(align) ) throw new NotAllowTextAlignType();

  return align;
};

// wrap 
export function cardItemTextWrapVo( wrap : CardItemTextProps["wrap"] ) : string {
  const name : string = "wrap";

  baseVo({ name, value : wrap, type : "string" });
  wrap = wrap.trim();

  const length : number = 20;
  if ( wrap.length > length ) throw new NotAllowMaxLengthText({ name, length });

  return wrap;
};