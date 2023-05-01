import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const YOUR_USER_POOL_ID = 'ca-central-1_33EIingnB'; // Replace with your user pool ID
const YOUR_AWS_REGION = 'ca-central-1'; // Replace with your AWS region

const JWKS_URI = `https://cognito-idp.${YOUR_AWS_REGION}.amazonaws.com/${YOUR_USER_POOL_ID}/.well-known/jwks.json`;

const client = jwksClient({
  jwksUri: JWKS_URI,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const typeDefs = `#graphql
  type Book {
    title: String
    author: String
  }

    type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: "The Awakening",
    author: "Kate Chopin"
  },
  {
    title: "City of Glass",
    author: "Paul Auster2"
  }
];

const books2 = [
  {
    title: "222",
    author: "Kate Chopin"
  },
  {
    title: "333",
    author: "Paul Auster2"
  }
];


const resolvers = {
  Query: {
    books: (_, __, context) => {
      console.log('wheee!')
      console.log(context)
      if (context.user) {
        return (books);
      } else {
        return (books2);
      }
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    
    console.log('token', token)

if (token) {
    try {
      const decodedToken = await new Promise((resolve, reject) => {
        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });

      return { user: decodedToken };
    } catch (err) {
      console.error('Invalid token:', err.message);
      // Return an empty object, allowing non-authenticated requests
      return {};
    }
  }
    return {};
  },
});

console.log(`🚀  Server ready at: ${url}`);
