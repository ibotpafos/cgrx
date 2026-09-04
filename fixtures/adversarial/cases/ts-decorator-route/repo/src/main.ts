declare function GetRoute(path: string): MethodDecorator;
class UsersController {
  @GetRoute("/users")
  list(): string[] { return []; }
}
