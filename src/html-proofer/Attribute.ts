import {IRunner} from '../interfaces/'

export class Attribute {
  protected runner: IRunner
  public rawAttribute: string | null;

  constructor(runner: IRunner, rawAttribute: string | null) {
    this.runner = runner
    this.rawAttribute = rawAttribute
  }
}
