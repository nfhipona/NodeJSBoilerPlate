'use strict';

const h                             =   require(__dirname + '/../helper/helper.js');
const { api, expect, headers, t }   =   require(__dirname + '/base.js');

describe('TEST: Template', () => {

    let token;

    it('POST /users/sign-in -- sign-in and get user token', done => {

        api
        .post('/users/sign-in')
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

    it(`PUT /users/password -- change logged in user's password`, done => {

        api
        .put('/users/password')
        .set(t(token))
        .set(headers)
        .send({
            'new_password': 'user@pw',
            'current_password': 'user@pw2'
        })
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            done();
        });
    });

    let userId;
    it('GET /users/lists -- get all users', done => {

        api
        .get('/users/lists')
        .set(t(token))
        .set(headers)
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            expect(data).to.have.lengthOf.above(0);

            const user = data.length > 0 ? data[0] : {};
            userId = user.id;

            done();
        });
    });

    it('DELETE /admin/users/:id -- delete a user account', done => {

        api
        .delete(`/admin/users/${userId}`)
        .set(t(token))
        .set(headers)
        .expect(200)
        .end((err, res) => {
            if (err) return done(err);

            expect(res.body.success).to.be.true;

            const data = res.body.data;
            data.should.have.property('id');

            const deletedId = Number(data.id);
            expect(deletedId).to.equal(userId);

            done();
        });
    });
});

