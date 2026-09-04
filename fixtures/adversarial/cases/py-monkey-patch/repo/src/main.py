class Service:
    def run(self):
        return 'original'

def replacement():
    return 'patched'

service = Service()
service.run = replacement
service.run()
