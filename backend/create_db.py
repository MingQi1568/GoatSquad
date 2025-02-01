from app import app, db
from auth import VideoVote, CustomMusic, SavedVideo, User

def init_db():
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")

        # Initialize admin user if needed
        if not User.query.first():
            from werkzeug.security import generate_password_hash
            admin_user = User(
                email='admin@example.com',
                password_hash=generate_password_hash('admin123'),
                firstName='Admin',
                lastName='User',
                username='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created successfully!")

if __name__ == "__main__":
    init_db() 