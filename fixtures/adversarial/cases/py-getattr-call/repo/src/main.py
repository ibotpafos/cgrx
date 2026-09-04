class Service:
    def start(self):
        return 'started'

service = Service()
method = 'start'
getattr(service, method)()
