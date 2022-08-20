import {CheerioAPI} from "cheerio";

export interface IHtml {
  css(selector:string): any

  content: string
  text: string
}
