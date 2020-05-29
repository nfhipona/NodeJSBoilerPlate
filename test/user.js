'use strict';

const h                             =   require(__dirname + '/../helper/helper.js');
const { api, expect, headers, t }   =   require(__dirname + '/base.js');

describe('TEST: USERS Endpoint', () => {

    let token, roleId;

    it('POST /users/signin -- sign-in and get user token', done => {

        api
        .post('/users/signin')
        .set(headers)
        .send({
            "email": "adminuser@gmail.com",
            "password": "1234"
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('user');
            data.should.have.property('account');
            data.should.have.property('token_data');

            const token_data = data.token_data;
            token = token_data.token;

            done();
        });
    });

    it('GET /roles -- fetch roles for signup test', done => {

        api
        .get('/roles')
        .set(headers)
        .set(t(token))
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('item_count');
            data.should.have.property('limit');
            data.should.have.property('page');
            data.should.have.property('items');

            const items = data.items;
            expect(items).to.have.lengthOf.above(0);

            const roleInfo = items[0];
            roleId = roleInfo.id;

            done();
        });
    });

    it('POST /users/signup -- sign-up user and email validation link', done => {

        let email = h.randChar(5) + `@gmail.com`;

        api
        .post('/users/signup')
        .set(headers)
        .send({
            "role_id": roleId,
            "email": email,
            "password": "1234"
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('email');
            data.should.have.property('token');

            expect(data.email).to.equal(email);

            done();
        });
    });
});