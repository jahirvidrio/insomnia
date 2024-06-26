import React, { Fragment, useCallback } from 'react';

import { isLoggedIn } from '../../../account/session';
import { useAIContext } from '../../context/app/ai-context';
import { Link } from '../base/link';
import { InsomniaAI } from '../insomnia-ai-icon';
import { hideAllModals, showModal } from '../modals';
import { LoginModal } from '../modals/login-modal';

export const AI = () => {
  const loggedIn = isLoggedIn();

  const handleLogin = useCallback((event: React.SyntheticEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    hideAllModals();
    showModal(LoginModal);
  }, []);

  const {
    access: {
      enabled,
      loading,
    },
  } = useAIContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (loggedIn && enabled) {
    return <Fragment>
      <div
        className="notice pad success"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1
          className="no-margin-top"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--padding-xs)',
          }}
        >Insomnia AI is enabled
          <InsomniaAI /> </h1>
        <p
          style={{
            textAlign: 'center',
            width: '100%',
            maxWidth: '66ch',
          }}
        >
          The Insomnia AI add-on is currently available on your account. The pay as-you-go consumption of this capability will be automatically added to your account and invoiced accordingly.
        </p>
        <br />
        <div
          className="pad"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--padding-xs)',
          }}
        >
          <i className='fa fa-info-circle' /> Beware that too many requests of Insomnia AI could generate an unpredictable spend.
        </div>
      </div>
    </Fragment >;
  }

  return (
    <Fragment>
      <div
        className="notice pad surprise"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1 className="no-margin-top">Try Insomnia AI <InsomniaAI /></h1>
        <p>
          Improve your productivity with Insomnia AI and perform complex operations in 1-click, like auto-generating API tests for your documents and collections.
          <br />
          <br />
          This capability is an add-on to Enterprise customers only.
        </p>
        <br />
        <div className="pad">
          <Link button className="btn btn--clicky" href="https://insomnia.rest/pricing/contact">
            Enable Insomnia AI <i className="fa fa-external-link" />
          </Link>
        </div>
      </div>
      {!loggedIn ? <p>
        Or{' '}<a href="#" onClick={handleLogin} className="theme--link">
          Log In
        </a>
      </p> : null}
    </Fragment >
  );
};
