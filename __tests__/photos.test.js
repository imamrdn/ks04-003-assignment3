const request = require('supertest');
const app = require('./../app');
const { sequelize } = require('./../models/index');
const { queryInterface } = sequelize;
const { hash } = require('./../helpers/hash');
const { sign } = require('../helpers/jwt');

const user = {
  username: 'mimam',
  email: 'mimam@mail.com',
  password: 'password',
  createdAt: new Date(),
  updatedAt: new Date()
};

const userToken = sign({ id: 1, email: user.email });
const userNotExistsToken = sign({ id: 99, email: 'notexists@mail.com' });

const defaultPhoto = {
  title: 'Photo 1',
  caption: 'Photo 1 caption',
  image_url: 'http://image.com/photo.png',
  createdAt: new Date(),
  updatedAt: new Date(),
  UserId: 1
};

const defaultPhotoInsert = {
  title: 'my photo 1',
  caption: 'MY PHOTO 1 https://unsplash.com/s/photos/view',
  image_url: 'https://unsplash.com/s/photos/view',
  createdAt: new Date(),
  updatedAt: new Date(),
  UserId: 1
};

beforeAll(async () => {
  await queryInterface.bulkDelete('Photos', null, {
    truncate: true,
    restartIdentity: true,
    cascade: true
  });
  await queryInterface.bulkDelete('Users', null, {
    truncate: true,
    restartIdentity: true,
    cascade: true
  });
  const hashedUser = { ...user };
  hashedUser.password = hash(hashedUser.password);
  await queryInterface.bulkInsert('Users', [hashedUser]);
  await queryInterface.bulkInsert('Photos', [defaultPhoto]);
});

afterAll(async () => {
  sequelize.close();
});

// GET all photos
describe('GET /photos', () => {
  // success
  test('should return HTTP status code 200', async () => {
    const { body } = await request(app)
      .get('/photos')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(body.length).toBe(1);
    expect(body[0]).toEqual({
      id: 1,
      title: defaultPhoto.title,
      caption: defaultPhoto.caption,
      image_url: defaultPhoto.image_url,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      UserId: 1
    });
  });
  // error
  test('should return HTTP status code 401 when no authorization', async () => {
    const { body } = await request(app)
      .get('/photos')
      .expect(401);
    expect(body.message).toMatch(/unauthorized/i);
  });
  test('should return HTTP status code 401 when no token provided', async () => {
    const { body } = await request(app)
      .get('/photos')
      .set('Authorization', 'Bearer ')
      .expect(401);
    expect(body.message).toMatch(/invalid token/i);
  });
  test('should return HTTP status code 401 when no token provided', async () => {
    const { body } = await request(app)
      .get('/photos')
      .set('Authorization', 'Bearer wrong.token.input')
      .expect(401);
    expect(body.message).toMatch(/invalid token/i);
  });
  test('should return HTTP status code 401 when user does not exist', async () => {
    const { body } = await request(app)
      .get('/photos')
      .set('Authorization', `Bearer ${userNotExistsToken}`)
      .expect(401);
    expect(body.message).toMatch(/unauthorized/i);
  });
});
// create photos
describe('POST /photos', () => {
  //success
  test('should return HTTP status code 201', async () => {
    const { body } = await request(app)
      .post('/photos')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: defaultPhotoInsert.title, image_url : defaultPhotoInsert.image_url })
      .expect(201);
    expect(body).toEqual({
      id: 2,
      title: defaultPhotoInsert.title,
      image_url: defaultPhotoInsert.image_url,
      UserId: 1,
      updatedAt: expect.any(String),
      createdAt: expect.any(String),
      caption: defaultPhotoInsert.caption,
    });
  });
  //errorr
  test('should return HTTP status code 401 when no authorization', async () => {
    const { body } = await request(app)
      .post('/photos')
      .expect(401);
    expect(body.message).toMatch(/unauthorized/i);
  });

   test('should return HTTP status code 401 when value image_url empety', async () => {
    const { body } = await request(app)
      .post('/photos')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: defaultPhotoInsert.title, image_url : "" })
      .expect(400);
    expect(body.message).toEqual([
      "Image URL cannot be an empty string",
        "Wrong URL format"
    ]);
  });

});
// GET photos by id
describe('GET /photos', () => {
  //success
  test('should return HTTP status code 200', async () => {
    const { body } = await request(app)
      .get('/photos/2')
       .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(body).toEqual({
      id: 2,
      title: defaultPhotoInsert.title,
      caption: defaultPhotoInsert.caption,
      image_url: defaultPhotoInsert.image_url,
      updatedAt: expect.any(String),
      createdAt: expect.any(String),
      User : {
        id : 1,
        username : user.username,
        email : user.email,
      }
    });
  });
  //error
  test('should return HTTP status code 401 when no authorization', async () => {
    const { body } = await request(app)
      .get('/photos/2')
      .expect(401);
    expect(body.message).toMatch(/unauthorized/i);
  });
  test('should return HTTP status code 404 when data not found', async () => {
    const { body } = await request(app)
      .get('/photos/10')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);
    expect(body.message).toMatch(/data not found/i);
  });

});