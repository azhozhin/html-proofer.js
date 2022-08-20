export function createCheck(ctor, runner, html) {
    return new ctor(runner, html);
}
