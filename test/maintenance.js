'use strict';

const h                             =   require(__dirname + '/../helper/helper.js');
const { api, expect, headers, t }   =   require(__dirname + '/base.js');

describe('TEST: MAINTENANCE ENDPOINT UNIT TESTS', () => {

    let token;

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

    it('GET /maintenance -- fetch maintenance status and information', done => {

        api
        .get('/maintenance')
        .set(t(token))
        .set(headers)
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            done();
        });
    });

    it(`PUT /maintenance -- set maintenance status and information to DOWN STATUS`, done => {

        api
        .put('/maintenance')
        .set(t(token))
        .set(headers)
        .send({
            'title': 'Server Update',
            'description': 'Regular server update',
            'message': 'Bug fixes and maintenance',
            'is_down': 1
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            done();
        });
    });

    it(`PUT /maintenance -- set maintenance status RUNNING`, done => {

        api
        .put('/maintenance')
        .set(t(token))
        .set(headers)
        .send({
            'title': 'Server is Running',
            'is_down': 0
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            done();
        });
    });

    it('GET /maintenance/history?limit=4 -- fetch maintenance status history with limit', done => {

        api
        .get('/maintenance/history?limit=4')
        .set(t(token))
        .set(headers)
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

            done();
        });
    });
});

