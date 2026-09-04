def route(path):
    return lambda function: function

@route("/users")
def list_users():
    return []
