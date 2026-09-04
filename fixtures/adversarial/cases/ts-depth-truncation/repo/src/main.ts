function levelThree(): void {}
function levelTwo(): void {
  levelThree();
}
function levelOne(): void {
  levelTwo();
}
levelOne();
