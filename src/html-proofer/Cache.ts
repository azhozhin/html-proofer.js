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

  public add_internal(url: any, metadata: any, found: any) {
    if (!this.enabled()) {
      return
    }
    // todo
  }

  public add_external(url: any, filenames: any, statusCode: any, msg: any) {
    if (!this.enabled()) {
      return
    }
    // todo
  }

  public write() {
    if (!this.enabled()) {
      return
    }
    // todo
  }

  public enabled() {
    // return this.options.cache != null
    return false
  }
}
