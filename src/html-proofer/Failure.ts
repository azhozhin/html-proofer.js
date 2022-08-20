export class Failure {
  path: string
  checkName: string
  description: string
  line: number | null
  status: string | null
  content: string | null

  constructor(path: string, checkName: string, description: string, line: (number | null) = null, status: (string | null) = null, content: (string | null) = null) {
    this.path = path
    this.checkName = checkName
    this.description = description

    this.line = line
    this.status = status
    this.content = content
  }
}

