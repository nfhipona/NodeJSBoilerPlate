'use strict';

const h                             =   require(__dirname + '/../helper/helper.js');
const { api, expect, headers, t }   =   require(__dirname + '/base.js');

return; // prevent script from running
describe('TEST: Template', () => {

    let token;

    it('POST /users/signin -- sign-in and get user token', done => {

        api
        .post('/users/signin')
        .set(headers)
        .send({
            "email": "user@domain.com",
            "password": "user@pw"
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

    it(`PUT /endpoint/:id -- update something`, done => {

        api
        .put('/endpoint/:id')
        .set(t(token))
        .set(headers)
        .send({
            'key': 'new value'
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            done();
        });
    });

    it('GET /endpoint?limit=4 -- get data with limit', done => {

        api
        .get('/endpoint?limit=4')
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

    it('DELETE /endpoint/:id -- remove data', done => {

        api
        .delete(`/endpoint/:id`)
        .set(t(token))
        .set(headers)
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');

            expect(data.id).to.be.equal(`:id`);

            done();
        });
    });
});

