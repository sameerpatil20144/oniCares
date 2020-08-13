/* eslint-disable no-undef */
/* eslint-disable */
/* eslint-disable no-console */
import React from 'react';
import { Route } from 'react-router-dom';
import PropTypes from 'prop-types';

const RouteWithLayout = props => {
  // console.log('porps: hjk', props)
  const { layout: Layout, component: Component, ...rest } = props;
  return (
    <Route
      {...rest}
      render={(matchProps) => (
        (props.layout ? (
          <Layout>
            <Component {...matchProps} />
          </Layout>
        ) : (
            <Component {...matchProps} />
          ))
      )}
    />
  );
};

RouteWithLayout.propTypes = {
  component: PropTypes.any.isRequired,
  path: PropTypes.string
};

export default RouteWithLayout;
