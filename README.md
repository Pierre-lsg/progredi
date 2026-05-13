# Presentation

Progredi is a habit tracker application. It helps you track your habits and build positive habits.

Progredi is built with Svelte and TypeScript. It is a static application.  
Data is stored on ther user's terminal

Documentation is in preparation and will soon be available in the [docs](./docs) directory.

# License

This project is licensed under MIT – see the [LICENSE](./LICENSE) file for more details.

# Development

## Prerequisites

- [git](https://git-scm.com/install)
- [node.js](https://nodejs.org/en/download)
- [npm](https://nodejs.org/en/download)

## Creating the project

This is a standard Svelte project. To build it, run:

```sh
# Clone the progredi project
git clone https://github.com/Pierre-lsg/progredi
# Move into the project tree
cd progredi/
# Install dependencies
npm install
```

## Test locally

To test the application locally, run the command `npm run dev`.

```sh
# Test on localhost
npm run dev
```

ou

```sh
# Test on local network
npm run dev -- --host
```

## Generate the final application

Among the commands for `npm run` described in the `package.json` file, we find:

- **build** – to build the static application to deploy on your web server
- **preview** – to launch a local test web server

The functional application is produced by executing:

```sh
npm run build
```

Deploying the `dist/` folder to a web server is your responsibility.

# Production

## Installing the application

The application is available wherever you deploy the `dist/` directory.

You can deploy it to your web server.

If you deploy on an apache server, an .htaccess is deployed and need to activate the rewrite module.

```sh
sudo a2enmod rewrite
sudo systemctl restart apache2
```

For others webservers, think about redirecting to index.html to avoid 404 error.
