require('dotenv').config();


const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const logger = require('morgan');
const methodOverride = require('method-override');

const fetch = require('node-fetch');
const path = require('path');
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(errorHandler());
app.use(logger('dev'));
app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));


const Prismic = require('@prismicio/client');
const PrismicH = require('@prismicio/helpers');

// Initialize the prismic.io api
const initApi = (req) => {
  return Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
    fetch,
  });
};

// Link Resolver
const HandleLinkResolver = (doc) => {
  if (doc.type === 'product') {
    return `/detail/${doc.slug}`;
  }

  if (doc.type === 'collection') {
    return '/collections';
  }

  if (doc.type === 'about') {
    return `/about`;
  }

  // Default to homepage
  return '/';
};

// Middleware to inject prismic context
app.use((req, res, next) => {
  res.locals.Link = HandleLinkResolver
  res.locals.Numbers = index => {
    return index == 0 ? "One" : index == 1 ? "Two" : index == 2 ? "Three" : index == 3 ? "Four" : index == 4;
  }
  res.locals.PrismicH = PrismicH;

  next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.basedir = app.get('views');

const handleRequest = async (api) => {
  const [ home, about, meta, navigation, preloader, {results: collections }] = await Promise.all([
    //api.getSingle('meta'),
    api.getSingle('home'),
    api.getSingle('about'),
    api.getSingle('meta'),
    api.getSingle('navigation'),
    api.getSingle('preloader'),
    api.query(Prismic.predicate.at('document.type', 'collections'), {
      fetchLinks: 'product.image',
    }),
  ]);

  const assets = [];

  about.data.gallery.forEach((item) => {
    assets.push(item.image.url);
  });

 about.data.body.forEach((section) => {
    if (section.slice_type === 'gallery') {
     section.items.forEach((item) => {
       assets.push(item.image.url);
      });
    }
  });

  collections.forEach((collection) => {
    collection.data.products.forEach((item) => {
      assets.push(item.products_product.data.image.url);
    });
  });

  return {
    about,
    collections,
    home,
    meta,
    navigation,
    preloader,
  };
};


app.get('/', async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);

  res.render('pages/home', {
    ...defaults,
  });
});

app.get('/about', async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);

  res.render('pages/about', {
    ...defaults,
  });

});

app.get('/collections', async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);

  res.render('pages/collections', {
    ...defaults,
  });
});


app.get('/detail/:uid', async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);



  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title',
  });

  res.render('pages/detail', {
    ...defaults,
    product,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

