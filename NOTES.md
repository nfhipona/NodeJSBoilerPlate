## INSTRUCTIONS

This instruction is intended for your **.env** file settings.

### Create your .env file

Next, add the following config and replace with your own config. *NODE_ENV* can be either: **development**, **staging** or **production**

NODE_ENV=development

DATABASE_DEV_URL=debug::false&connectionLimit::1000&host::localhost&user::db_user&password::your_password_or_leave_empty&database::your_database_name
DATABASE_DEV_TEST_URL=debug::false&connectionLimit::1000&host::localhost&user::db_user&password::your_password_or_leave_empty&database::your_database_name
DATABASE_STAGING_URL=debug::false&connectionLimit::1000&host::your_staging_host&user::staging_user&password::staging_password&database::your_database_name
DATABASE_PRODUCTION_URL=debug::false&connectionLimit::1000&host::your_production_host&user::production_user&password::production_password&database::your_database_name

SERVER_CONFIG=port::6477&host::127.0.0.1
JWT_CONFIG=secret::your-app-secret&algorithm::HS256&expiresIn::604800
SOCKET_CONFIG=port::6477&host::127.0.0.1
REDIS=port::6379&host::localhost&password::your-redis-pw

MAIL_AUTH=user::noreply@youremail.com.au&pass::your-email-pass
MAIL_CONFIG=host::your-webmail-host.com&port::465&secure::true

DEVELOPMENT_ENV=web::http://127.0.0.1:3000&api::http://127.0.0.1:6477
STAGING_ENV=web::https://staging.yourdomain.com&api::https://api-staging.yourdomain.com
PRODUCTION_ENV=web::https://yourdomain.com&api::https://api.yourdomain.com

IMAGE_FILE_PATH=path::nodejsboilerplate/image_files/

AWS_CONFIG_DEV=accessKeyId::ACCESS_KEY_ID&secretAccessKey::SECRET_ACCESS_KEY&profile::neverstop-development&apiVersion::API_VERSION
AWS_CONFIG_STAGING=accessKeyId::ACCESS_KEY_ID&secretAccessKey::SECRET_ACCESS_KEY&profile::neverstop-staging&apiVersion::API_VERSION
AWS_CONFIG_PRODUCTION=accessKeyId::ACCESS_KEY_ID&secretAccessKey::SECRET_ACCESS_KEY&profile::neverstop-production&apiVersion::API_VERSION

AWS_BUCKET_DEV=region::AWS_BUCKET_REGION&bucket::BUCKET_NAME_DEV
AWS_BUCKET_STAGING=region::AWS_BUCKET_REGION&bucket::BUCKET_NAME_STAGING
AWS_BUCKET_PRODUCTION=region::AWS_BUCKET_REGION&bucket::BUCKET_NAME_PRODUCTION

AWS_BUCKET_PATH=avatar::avatar_files&sound::sound_files&assets::asset_files

ENCRYPTION=salt::your_salt_here&byteLength::32&algorithm::aes-256-cbc&password::your_encrypt_password

## License

SAMS API is available under the MIT license. See the [LICENSE](https://bitbucket.org/nferocious76/sams-api/src/master/LICENSE) file for more info.