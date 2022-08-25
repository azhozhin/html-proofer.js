import {Reporter} from "./Reporter";

export class DummyReporter extends Reporter{

  report(): void {
    // this is intentionally doing nothing
  }

}
