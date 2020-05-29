'use strict';

const h                             =   require(__dirname + '/../helper/helper.js');
const { api, expect, headers, t }   =   require(__dirname + '/base.js');

describe('TEST: ROLES', () => {

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

    let roleId;
    it('POST /roles -- create new role', done => {

        let role_code = h.randString(5);

        api
        .post('/roles')
        .set(headers)
        .set(t(token))
        .send({
            "code": role_code,
            "name": role_code + `_role`,
            "description": role_code + `_role_test`
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');
            data.should.have.property('code');

            expect(data.code).to.equal(role_code);
            roleId = data.id;

            done();
        });
    });

    it('PUT /roles/:id -- update role information', done => {

        api
        .put(`/roles/${roleId}`)
        .set(headers)
        .set(t(token))
        .send({
            "description": `This role with id: ${roleId} was edited`
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');
            data.should.have.property('code');

            expect(data.id).to.equal(roleId);

            done();
        });
    });

    it('GET /roles?limit=5 -- fetch roles with limit', done => {

        api
        .get('/roles?limit=5')
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

    it('DELETE /roles/:id -- remove role with id', done => {

        api
        .delete(`/roles/${roleId}`)
        .set(t(token))
        .set(headers)
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');

            expect(data.id).to.equal(roleId);

            done();
        });
    });
});

