'use strict';

const h                             =   require(__dirname + '/../helper/helper.js');
const { api, expect, headers, t }   =   require(__dirname + '/base.js');

describe('TEST: RESOURCES', () => {

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

    let resourceId;
    it('POST /resources -- create new resource', done => {

        let resource_code = h.randString(5);

        api
        .post('/resources')
        .set(headers)
        .set(t(token))
        .send({
            "code": resource_code,
            "name": resource_code + `_resource`,
            "description": resource_code + `_resource_test`
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');
            data.should.have.property('code');

            expect(data.code).to.equal(resource_code);
            resourceId = data.id;

            done();
        });
    });

    it('PUT /resources/:id -- update resource information', done => {

        api
        .put(`/resources/${resourceId}`)
        .set(headers)
        .set(t(token))
        .send({
            "description": `This resource with id: ${resourceId} was edited`
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');
            data.should.have.property('code');

            expect(data.id).to.equal(resourceId);

            done();
        });
    });

    it('GET /resources/:id -- fetch single resource with id', done => {

        api
        .get(`/resources/${resourceId}`)
        .set(headers)
        .set(t(token))
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');

            expect(data.id).to.equal(resourceId);

            done();
        });
    });

    it('GET /resources?limit=5 -- fetch resources with limit', done => {

        api
        .get('/resources?limit=5')
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

            done();
        });
    });

    it('PUT /resources/:id/disabled -- disable resource with id', done => {

        api
        .put(`/resources/${resourceId}/disabled`)
        .set(headers)
        .set(t(token))
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');

            expect(data.id).to.equal(resourceId);
            expect(data.deleted).to.equal(1);

            done();
        });
    });

    it('PUT /resources/:id/enabled -- re-enable resource with id', done => {

        api
        .put(`/resources/${resourceId}/enabled`)
        .set(headers)
        .set(t(token))
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');

            expect(data.id).to.equal(resourceId);
            expect(data.deleted).to.equal(0);

            done();
        });
    });
});

