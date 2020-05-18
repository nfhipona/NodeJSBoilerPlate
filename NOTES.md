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

## License

SAMS API is available under the MIT license. See the [LICENSE](https://bitbucket.org/nferocious76/sams-api/src/master/LICENSE) file for more info.