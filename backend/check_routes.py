from app.main import app

def check_routes():
    routes = [route.path for route in app.routes]
    print(f"Total registered routes: {len(routes)}")
    for r in routes:
        print(f"  - {r}")

if __name__ == "__main__":
    check_routes()
