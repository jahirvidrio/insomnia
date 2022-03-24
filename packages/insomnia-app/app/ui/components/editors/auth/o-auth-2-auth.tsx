import { Button } from 'insomnia-components';
import React, { ChangeEvent, FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { convertEpochToMilliseconds, toKebabCase } from '../../../../common/misc';
import accessTokenUrls from '../../../../datasets/access-token-urls';
import authorizationUrls from '../../../../datasets/authorization-urls';
import * as models from '../../../../models';
import type { OAuth2Token } from '../../../../models/o-auth-2-token';
import type { Request } from '../../../../models/request';
import {
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_CLIENT_CREDENTIALS,
  GRANT_TYPE_IMPLICIT,
  GRANT_TYPE_PASSWORD,
  PKCE_CHALLENGE_PLAIN,
  PKCE_CHALLENGE_S256,
  RESPONSE_TYPE_ID_TOKEN,
  RESPONSE_TYPE_ID_TOKEN_TOKEN,
  RESPONSE_TYPE_TOKEN,
} from '../../../../network/o-auth-2/constants';
import getAccessToken from '../../../../network/o-auth-2/get-token';
import { initNewOAuthSession } from '../../../../network/o-auth-2/misc';
import { useNunjucks } from '../../../context/nunjucks/use-nunjucks';
import { useActiveRequest } from '../../../hooks/use-active-request';
import { selectActiveOAuth2Token } from '../../../redux/selectors';
import { Link } from '../../base/link';
import { PromptButton } from '../../base/prompt-button';
import { showModal } from '../../modals';
import { ResponseDebugModal } from '../../modals/response-debug-modal';
import { TimeFromNow } from '../../time-from-now';
import { AuthAccordion } from './components/auth-accordion';
import { AuthInputRow } from './components/auth-input-row';
import { AuthSelectRow } from './components/auth-select-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

const getAuthorizationUrls = () => authorizationUrls;
const getAccessTokenUrls = () => accessTokenUrls;

const grantTypeOptions = [
  {
    name: 'Authorization Code',
    value: GRANT_TYPE_AUTHORIZATION_CODE,
  },
  {
    name: 'Implicit',
    value: GRANT_TYPE_IMPLICIT,
  },
  {
    name: 'Resource Owner Password Credentials',
    value: GRANT_TYPE_PASSWORD,
  },
  {
    name: 'Client Credentials',
    value: GRANT_TYPE_CLIENT_CREDENTIALS,
  },
];

const pkceMethodOptions = [
  {
    name: 'SHA-256',
    value: PKCE_CHALLENGE_S256,
  },
  {
    name: 'Plain',
    value: PKCE_CHALLENGE_PLAIN,
  },
];

const responseTypeOptions = [
  {
    name: 'Access Token',
    value: RESPONSE_TYPE_TOKEN,
  },
  {
    name: 'ID Token',
    value: RESPONSE_TYPE_ID_TOKEN,
  },
  {
    name: 'ID and Access Token',
    value: RESPONSE_TYPE_ID_TOKEN_TOKEN,
  },
];

const credentialsInBodyOptions = [
  {
    name: 'As Basic Auth Header (default)',
    value: 'false',
  },
  {
    name: 'In Request Body',
    value: 'true',
  },
];

const getFields = (authentication: Request['authentication']) => {
  const clientId = <AuthInputRow label='Client ID' property='clientId' key='clientId' />;
  const clientSecret = <AuthInputRow label='Client Secret' property='clientSecret' key='clientSecret' />;
  const usePkce = <AuthToggleRow label='Use PKCE' property='usePkce' key='usePkce' onTitle='Disable PKCE' offTitle='Enable PKCE' />;
  const pkceMethod = <AuthSelectRow
    label='Code Challenge Method'
    property='pkceMethod'
    key='pkceMethod'
    disabled={!authentication.usePkce}
    options={pkceMethodOptions}
  />;
  const authorizationUrl = <AuthInputRow label='Authorization URL' property='authorizationUrl' key='authorizationUrl' getAutocompleteConstants={getAuthorizationUrls} />;
  const accessTokenUrl = <AuthInputRow label='Access Token URL' property='accessTokenUrl' key='accessTokenUrl'  getAutocompleteConstants={getAccessTokenUrls} />;
  const redirectUri = <AuthInputRow label='Redirect URL' property='redirectUrl' key='redirectUrl' help='This can be whatever you want or need it to be. Insomnia will automatically detect a redirect in the client browser window and extract the code from the redirected URL.' />;
  const state = <AuthInputRow label='State' property='state' key='state' />;
  const scope = <AuthInputRow label='Scope' property='scope' key='scope' />;
  const username = <AuthInputRow label='Username' property='username' key='username' />;
  const password = <AuthInputRow label='Password' property='password' key='password' mask/>;
  const tokenPrefix = <AuthInputRow label='Header Prefix' property='tokenPrefix' key='tokenPrefix' help='Change Authorization header prefix from "Bearer" to something else. Use "NO_PREFIX" to send raw token without prefix.' />;
  const responseType = <AuthSelectRow
    label='Response Type'
    property='responseType'
    key='responseType'
    options={responseTypeOptions}
    help='Indicates the type of credentials returned in the response'
  />;
  const audience = <AuthInputRow label='Audience' property='audience' key='audience' help='Indicate what resource server to access' />;
  const resource = <AuthInputRow label='Resource' property='resource' key='resource' help='Indicate what resource to access' />;
  const origin = <AuthInputRow label='Origin' property='origin' key='origin' help='Specify Origin header when CORS is required for oauth endpoints' />;
  const credentialsInBody = <AuthSelectRow
    label='Credentials'
    property='credentialsInBody'
    key='credentialsInBody'
    options={credentialsInBodyOptions}
    help='Whether or not to send credentials as Basic Auth, or as plain text in the request body'
  />;

  return {
    clientId,
    clientSecret,
    usePkce,
    pkceMethod,
    authorizationUrl,
    accessTokenUrl,
    redirectUri,
    state,
    scope,
    username,
    password,
    tokenPrefix,
    responseType,
    audience,
    resource,
    origin,
    credentialsInBody,
  };
};

const getFieldsForGrantType = (authentication: Request['authentication']) => {
  const {
    clientId,
    clientSecret,
    usePkce,
    pkceMethod,
    authorizationUrl,
    accessTokenUrl,
    redirectUri,
    state,
    scope,
    username,
    password,
    tokenPrefix,
    responseType,
    audience,
    resource,
    origin,
    credentialsInBody,
  } = getFields(authentication);

  const { grantType } = authentication;

  let basic: ReactNode[] = [];
  let advanced: ReactNode[] = [];

  if (grantType === GRANT_TYPE_AUTHORIZATION_CODE) {
    basic = [
      authorizationUrl,
      accessTokenUrl,
      clientId,
      clientSecret,
      usePkce,
      pkceMethod,
      redirectUri,
    ];

    advanced = [
      scope,
      state,
      credentialsInBody,
      tokenPrefix,
      audience,
      resource,
      origin,
    ];
  } else if (grantType === GRANT_TYPE_CLIENT_CREDENTIALS) {
    basic = [
      accessTokenUrl,
      clientId,
      clientSecret,
    ];

    advanced = [
      scope,
      credentialsInBody,
      tokenPrefix,
      audience,
      resource,
    ];
  } else if (grantType === GRANT_TYPE_PASSWORD) {
    basic = [
      username,
      password,
      accessTokenUrl,
      clientId,
      clientSecret,
    ];

    advanced = [
      scope,
      credentialsInBody,
      tokenPrefix,
      audience,
    ];
  } else if (grantType === GRANT_TYPE_IMPLICIT) {
    basic = [
      authorizationUrl,
      clientId,
      redirectUri,
    ];

    advanced = [
      responseType,
      scope,
      state,
      tokenPrefix,
      audience,
    ];
  }

  return {
    basic,
    advanced,
  };
};

export const OAuth2Auth: FC = () => {
  const { activeRequest: { authentication } } = useActiveRequest();
  const { basic, advanced } = getFieldsForGrantType(authentication);

  return (
    <>
      <AuthTableBody>
        <AuthSelectRow
          label='Grant Type'
          property='grantType'
          options={grantTypeOptions}
        />
        {basic}
        <AuthAccordion accordionKey='OAuth2AdvancedOptions' label='Advanced Options'>
          {advanced}
          {
            <tr>
              <td/>
              <td className="wide">
                <div className="pad-top text-right">
                  <button className="btn btn--clicky" onClick={initNewOAuthSession}>
                    Clear OAuth 2 session
                  </button>
                </div>
              </td>
            </tr>
          }
        </AuthAccordion>
      </AuthTableBody>
      <div className='pad'>
        <OAuth2Tokens />
      </div>
    </>
  );
};

const renderIdentityTokenExpiry = (token?: Pick<OAuth2Token, 'identityToken'>) => {
  if (!token || !token.identityToken) {
    return;
  }

  const base64Url = token.identityToken.split('.')[1];
  let decodedString = '';

  try {
    decodedString = window.atob(base64Url);
  } catch (error) {
    return;
  }

  const { exp } = JSON.parse(decodedString);

  if (!exp) {
    return '(never expires)';
  }

  const convertedExp = convertEpochToMilliseconds(exp);
  return (
    <span>
      &#x28;expires <TimeFromNow timestamp={convertedExp} />
      &#x29;
    </span>
  );
};

const renderAccessTokenExpiry = (token?: Pick<OAuth2Token, 'accessToken' | 'expiresAt'>) => {
  if (!token || !token.accessToken) {
    return null;
  }

  if (!token.expiresAt) {
    return '(never expires)';
  }

  return (
    <span>
      &#x28;expires <TimeFromNow timestamp={token.expiresAt} />
      &#x29;
    </span>
  );
};

const OAuth2TokenInput: FC<{label: string; property: keyof Pick<OAuth2Token, 'accessToken' | 'refreshToken' | 'identityToken'>}> = ({ label, property }) => {
  const { activeRequest } = useActiveRequest();
  const token = useSelector(selectActiveOAuth2Token);

  const onChange = async ({ currentTarget: { value } }: ChangeEvent<HTMLInputElement>) => {
    if (token) {
      await models.oAuth2Token.update(token, { [property]: value });
    } else {
      await models.oAuth2Token.create({ [property]: value, parentId: activeRequest._id });
    }
  };

  const expiryLabel = useMemo(() => {
    if (property === 'identityToken') {
      return renderIdentityTokenExpiry(token);
    } else if (property === 'accessToken') {
      return renderAccessTokenExpiry(token);
    } else {
      return null;
    }
  }, [property, token]);

  const id = toKebabCase(label);

  return (
    <div className='form-control form-control--outlined'>
      <label htmlFor={id}>
        <small>{label}{expiryLabel ? <em> {expiryLabel}</em> : null}</small>
        <input
          value={token?.[property] || ''}
          placeholder='n/a'
          onChange={onChange}
        />
      </label>
    </div>
  );
};

const OAuth2Error: FC = () => {
  const token = useSelector(selectActiveOAuth2Token);

  const debug = () => {
    if (!token || !token.xResponseId) {
      return;
    }

    showModal(ResponseDebugModal, {
      responseId: token.xResponseId,
      showBody: true,
    });
  };

  const debugButton = token?.xResponseId ? (
    <Button
      onClick={debug}
      className="margin-top-sm"
      title="View response timeline"
    >
      <i className="fa fa-bug space-right" /> Response Timeline
    </Button>
  ) : null;

  const errorUriButton = token?.errorUri ? (
    <Link href={token.errorUri} title={token.errorUri} className="space-left icon">
      <i className="fa fa-question-circle" />
    </Link>
  ) : null;

  const error = token ? token.error || token.xError : null;

  if (token && error) {
    const { errorDescription } = token;
    return (
      <div className="notice error margin-bottom">
        <h2 className="no-margin-top txt-lg force-wrap">{error}</h2>
        <p>
          {errorDescription || 'no description provided'}
          {errorUriButton}
        </p>
        {debugButton}
      </div>
    );
  }
  return null;
};

const useActiveOAuth2Token = () => {
  const token = useSelector(selectActiveOAuth2Token);
  const { activeRequest: { authentication, _id: requestId } } = useActiveRequest();
  const { handleRender } = useNunjucks();

  const clearTokens = useCallback(async () => {
    if (token) {
      await models.oAuth2Token.remove(token);
    }
  }, [token]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshToken = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const renderedAuthentication = await handleRender(authentication);
      await getAccessToken(requestId, renderedAuthentication, true);
      setLoading(false);
    } catch (err) {
      // Clear existing tokens if there's an error
      await clearTokens();
      setError(err.message);
      setLoading(false);
    }
  }, [authentication, clearTokens, handleRender, requestId]);

  return { error, loading, token, clearTokens, refreshToken };
};

const OAuth2Tokens: FC = () => {
  const { token, clearTokens, refreshToken, loading, error } = useActiveOAuth2Token();

  return (
    <div className='notice subtle text-left'>
      {error && (
        <p className="selectable notice warning margin-bottom">
          {error}
        </p>
      )}
      <OAuth2Error />
      <OAuth2TokenInput label='Refresh Token' property='refreshToken' />
      <OAuth2TokenInput label='Identity Token' property='identityToken' />
      <OAuth2TokenInput label='Access Token' property='accessToken' />
      <div className='pad-top text-right'>
        {token ? (
          <PromptButton className="btn btn--clicky" onClick={clearTokens}>
            Clear
          </PromptButton>
        ) : null}
        &nbsp;&nbsp;
        <button
          className="btn btn--clicky"
          onClick={refreshToken}
          disabled={loading}
        >
          {loading
            ? token
              ? 'Refreshing...'
              : 'Fetching...'
            : token
              ? 'Refresh Token'
              : 'Fetch Tokens'}
        </button>
      </div>
    </div>
  );
};
