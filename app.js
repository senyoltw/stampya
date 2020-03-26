'use strict';

const Hapi = require('hapi'),
      Joi = require('joi'),
      WebClient = require('@slack/client').WebClient,
      url = require('url'),
      path = require('path'),
      mongoose = require('mongoose'),
      User = require('./models/user');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI);

const getUser = async (id) => {
  const user = await User.findOne({ id });
  if (!user) throw new Error(`You are not authorized. Please sign up from ${process.env.URL}`);
  return user;
}

const createClient = async (token) => {
  return new WebClient(token);
}

const getEmoji = async (client, emoji) => {
  const list = await client.emoji.list();
  const emojis = list.emoji || {};

  if (!emojis[emoji]) throw new Error(`${emoji} is missing or an error has occurred. please try again :pray:`);

  return emojis[emoji];
}

const response = async (client, id, image, text) => {
  await client.chat.postMessage({
    channel: id,
    as_user: true,
    text: '/stamp '+text,
    attachments: [{
      color: '#fff',
      text: '',
      image_url: image,
    }],
  });
}

const server = new Hapi.Server({
  routes: {
    files: {
      relativeTo: path.join(__dirname, 'public')
    }
  },
  port: (process.env.PORT || 8124),
});

const rootHandler = async (request, h, source, err) => {
  if (err) {
    server.log('error', [err.message, err.stack]);
    return { text: 'An error has occurred :pray:' };
  }

  const {
    text,
    user_id: userID,
    channel_id: channelID,
  } = request.payload;


  try {
    const emoji = text.replace(/:([^:]+):/, '$1');
    const user = await getUser(userID);
    const client = await createClient(user.token);
    const image = await getEmoji(client, emoji);

    await response(client, channelID, image, text);

    return null;
  } catch(e) {
    server.log('error', [e.message, e.stack]);
    return { text: e.message };
  }
}

const payloadValidationSchema = {
  token: Joi.string().valid(process.env.SLACK_VERIFICATION_TOKEN).options({
    language: { any: { allowOnly: 'xxxxxxxxxxx' } }
  }),
  team_id: Joi.any(),
  team_domain: Joi.any(),
  channel_id: Joi.any(),
  channel_name: Joi.any(),
  user_id: Joi.any(),
  user_name: Joi.any(),
  command: Joi.string().valid('/stamp'),
  text: Joi.string().regex(/^:[^:]+:$/),
  response_url: Joi.string().uri(),
  trigger_id: Joi.any(),
};

const provision = async () => {
  await server.register({
    plugin: require('good'),
    options: {
      reporters: {
        consoleReporter: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{ log: '*', response: '*', request: 'e' }]
        }, {
          module: 'good-console'
        }, 'stdout'],
        http: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{ error: '*' }],
        }],
      }
    }
  });

  await server.register(require('inert'));

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true
      }
    }
  });

  await server.register(require('vision'));

  server.views({
    engines: {
      html: require('handlebars'),
    },
    relativeTo: __dirname,
    path: 'templates',
    layout: true,
    layoutPath: path.join(__dirname, 'templates/layout'),
  });

  server.route({
    method: 'POST',
    path:'/',
    options: {
      validate: {
        payload: payloadValidationSchema,
        failAction: (request, h, err) => {
          server.log('error', [err.message, err.details]);
          return h.response({ text: err.message }).takeover();
        },
      },
    },
    handler: rootHandler,
  });

  server.route({
    method: 'GET',
    path:'/',
    handler: (request, h) => {
      return h.view('index');
    },
  });

  await server.register(require('bell'));

  server.auth.strategy('slack', 'bell', {
    provider: 'slack',
    password: 'cookie_encryption_password_secure',
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    scope: ['commands', 'chat:write:user', 'emoji:read'],
    isSecure: false
  });

  server.route({
    method: ['GET', 'POST'],
    path: '/auth',
    options: {
      auth: 'slack',
      handler: (request) => {
        if (!request.auth.isAuthenticated) {
          return `Authentication failed due to: ${request.auth.error.message}`;
        }

        const { user_id: id, access_token: token } = request.auth.credentials.profile;
        return User.update({ id }, { id, token }, { upsert: true }).then(() => {
          return 'Success';
        }).catch(() => {
          return `An error has occurred. please try agein. <a href="${process.env.URL}">${process.env.URL}</a>`;
        });
      }
    }
  });

  server.start(() => {
    console.log('Server running at:', server.info.uri);
  });
}

provision();