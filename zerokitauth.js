module.exports = function(deps) {
  const jwt = require('jsonwebtoken');
  return class ZeroKitAuthProvider extends deps.BaseAuthProvider {
    static get name() {
      return "zerokit";
    }
    static get defaultOptions() {
      return {
        service_url: "{{YourServiceUrl}}",
        client_id: "{{YourClientId}}",
        client_secret: "{{YourClientSecret}}"
      };
    }
    constructor(name, options, requestPromise) {
      super(name, options, requestPromise);
      if ( // We check if any values are still on the default
      options.service_url === "{{YourServiceUrl}}" ||
      options.client_id === "{{YourClientId}}" ||
      options.client_secret === "{{YourClientSecret}}"
      )
        throw new Error("NotProperlyConfigured");

      this._service_url = options.service_url;
      this._issuer = options.service_url + '/idp';
      this._client_id = options.client_id;
      this._client_secret = options.client_secret;
    }

    verifyIdentifier(req) {
      // The body should simply be: `${authorizationCode}:${verifier}` or `${authorizationCode}`
      const data = req.body.data.split(":");

      const code = data[0];
      const verifier = data[1];

      const params = [
        ["grant_type", "authorization_code"],
        ["client_id", this._client_id],
        ["client_secret", this._client_secret],
        ["redirect_uri", `https://${this._client_id}.${this._service_url.substr(8)}/`],
        ["code", code]
      ];

      if(verifier) // We only set this if we have an actual valude for it.
        params["verifier"] = verifier;

      return this.request({
        method: "POST",
        headers: {
          Accept: "application/json", // We get json back
          "Content-Type": "application/x-www-form-urlencoded" // We send form-urlencoded data
        },
        uri: `${this._service_url}/idp/connect/token`,
        body: params.map(v => v[0] + "=" + encodeURIComponent(v[1])).join("&") // Form-urlencoding by hand
      }).then(
        res => {
          // The result is passed back json encoded
          const results = JSON.parse(res);
          // and it is actually a jwt
          const idtoken = jwt.decode(results.id_token, { complete: true });

          // We need to validate the token before extracting the user identity to ensure that it is valid.
          // http://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
          // 2. The Issuer Identifier for the OpenID Provider (which is typically obtained during Discovery) MUST exactly match the value of the iss (issuer) Claim.
          if (idtoken.payload.iss !== this._issuer) // In our case we don't need to discovert it, we know it beforehand
            throw new deps.problem.HttpProblem.Unauthorized({ detail: "Invalid issuer" });

          // 3. The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience. The aud (audience) Claim MAY contain an array with more than one element. The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
          if (idtoken.payload.aud !== this._client_id) // TODO: multiple audience
            throw new deps.problem.HttpProblem.Unauthorized({ detail: "Invalid audience" });

          // TODO: We don't serve tokens with multiple audiences and there is no azp claim (but we should still do the validation)
          // 4. If the ID Token contains multiple audiences, the Client SHOULD verify that an azp Claim is present.
          // 5. If an azp (authorized party) Claim is present, the Client SHOULD verify that its client_id is the Claim Value.

          // 6. If the ID Token is received via direct communication between the Client and the Token Endpoint (which it is in this flow), the TLS server validation MAY be used to validate the issuer in place of checking the token signature. The Client MUST validate the signature of all other ID Tokens according to JWS [JWS] using the algorithm specified in the JWT alg Header Parameter. The Client MUST use the keys provided by the Issuer.
          // This is direct communication in our case
          /* but it can be done if specified in the config
           if (config.zeroKit.idp.validateSignature && config.zeroKit.idp.keyValidationFile) {
           const path = require("path"); // Should be moved up top if used
           const pems = require(path.join(__dirname, config.zeroKit.idp.keyValidationFile));
           try {
           jwt.verify(results.id_token, pems[idtoken.header.kid], {
           algorithms: ["RS256"]
           });
           } catch (ex) {
           return throw new deps.problem.HttpProblem.Unauthorized({detail: "TokenValidationError", ex});
           }
           }
           */
          // 7. The alg value SHOULD be the default of RS256 or the algorithm sent by the Client in the id_token_signed_response_alg parameter during Registration.
          if (idtoken.header.alg !== "RS256")
            throw new deps.problem.HttpProblem.Unauthorized({ detail: "Invalid signing alg" });

          // 8. The current time MUST be before the time represented by the exp Claim.
          if (idtoken.payload.exp * 1000 < Date.now())
            throw new deps.problem.HttpProblem.Unauthorized({ detail: "Expired token" });

          // 9. The iat Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks. The acceptable range is Client specific.
          if (idtoken.payload.iat * 1000 < Date.now() - 300000)
            throw new deps.problem.HttpProblem.Unauthorized({ detail: "Token too old" });

          if (idtoken.payload.iat * 1000 > Date.now())
            throw new deps.problem.HttpProblem.Unauthorized({ detail: "Token issued in future" });

          /* TODO: we don't requiest anything else, but we should think about implementing some kind of validation
           10. If a nonce value was sent in the Authentication Request, a nonce Claim MUST be present and its value checked to verify that it is the same value as the one that was sent in the Authentication Request. The Client SHOULD check the nonce value for replay attacks. The precise method for detecting replay attacks is Client specific.
           11. If the acr Claim was requested, the Client SHOULD check that the asserted Claim Value is appropriate. The meaning and processing of acr Claim Values is out of scope for this specification.
           12. If the auth_time Claim was requested, either through a specific request for this Claim or by using the max_age parameter, the Client SHOULD check the auth_time Claim value and request re-authentication if it determines too much time has elapsed since the last End-userSchema authentication.
           */
          return idtoken.payload.sub;
        },
        error => {
          throw new deps.problem.HttpProblem.Unauthorized({ detail: JSON.stringify(error), inner: error });
        }
      );
    }
  }
}