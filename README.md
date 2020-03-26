# slamp

## What is it? What is it?

Chat with big :emoji: in slack.

## Install yourself

### Create heroku application

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Now, environment variables is temporary.

### Create slack application

Go to [Slack API: Applications](https://api.slack.com/apps).

1. `Create New app`.

2. Setup application.
  - `App Name`: Slamp
  - `Development Slack Team`: Select team installed application.
3. `Create New app`.


### Create Slash commands

In the slack application.

1. Select `Slack Commands` from Features menu.
2. `Create New Command`.
3. Setup Slack commands.
  - `Command`: Slamp (or name yourself)
  - `Request URL`: Your application URL.
  - `Short Description`: Stamp emoji
  - `Usage Hint`: :emoji:
4. `Save`.

### Setup OAuth

Select `OAuth & Permissions` from Features menu.

#### Redirect URLs

1. `Add a new Redirect URL`
  - `${YOUR_APPLICATION_URL}/auth`
2. `Add` and `Save URLs`.

#### Select Permission Scopes

Select Permission scopes below.

- `emoji:read`
- `chat:write:user`

### Install app

Select `OAuth & Permissions` from Features menu.

1. `Install App to Team`
2. `Authorize`

### Setup environment variables

In the heroku application, input variables from slack application `App Credentials`.

#### Configure URL

```sh
heroku config:set URL=$(heroku info -s | grep web_url | cut -d= -f2)
```

#### Set CRON

```sh
*/30 * * * * curl -IL https://[APPNAME].herokuapp.com/ >/dev/null 2>&1
```

## Usage

type below in slack.

`/stamp :custom_emoji:`

![image](https://github.com/senyoltw/stampya/raw/master/images/stamp.png)

