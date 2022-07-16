export class Failure {

  constructor(path, check_name, description, line = null, status = null, content = null) {
    this.path = path
    this.check_name = check_name
    this.description = description

    this.line = line
    this.status = status
    this.content = content
  }
}

