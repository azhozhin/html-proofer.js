import {EmptyOptions, IOptions, IRunner, ILogger, ICache} from '../interfaces';


export class Cache implements ICache {
  private readonly runner: IRunner
  private readonly logger: ILogger
  private readonly options: IOptions

  constructor(runner: IRunner, opts?: IOptions) {
    this.runner = runner
    this.logger = runner.logger
    this.options = opts || EmptyOptions
  }

  public addInternalUrl(url: any, metadata: any, found: any) {
    if (!this.isEnabled()) {
      return
    }
    // todo
  }

  public addExternalUrl(url: any, filenames: any, statusCode: any, msg: any) {
    if (!this.isEnabled()) {
      return
    }
    // todo
  }

  public write() {
    if (!this.isEnabled()) {
      return
    }
    // todo
  }

  public isEnabled() {
    // return this.options.cache != null
    return false
  }
}
