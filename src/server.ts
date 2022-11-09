import express, { NextFunction } from 'express';
import { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import { config } from './config/config';
import * as jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers || !req.headers.authorization){
      return res.status(401).send({ message: 'No authorization headers.' });
  }
  
  const token_bearer = req.headers.authorization.split(' ');
  if(token_bearer.length != 2){
      return res.status(401).send({ message: 'Malformed token.' });
  }
  
  const token = token_bearer[1];

  return jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Failed to authenticate.' });
    }
    return next();
  });
}

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  app.get("/filteredimage/", requireAuth, async ( req, res ) => {
    let {image_url} = req.query;
    if (!image_url){
      res.status(400).send('Error : The image URL is required.');
    }
    else{
      await filterImageFromURL(image_url).then( function (filteredpath){
        return res.sendFile(filteredpath, error => {
          if (!error){
            deleteLocalFiles([filteredpath]);
          }
        });
      }).catch(function(err){
        return res.status(400).send('Some thing went wrong! ' + err);
      });
    }
  });
  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", requireAuth, async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();
