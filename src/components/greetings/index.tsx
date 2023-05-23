import React, { Component } from 'react';

class GreetingComponent extends Component {
  public state = {
    name: 'dev',
  };

  public render() {
    return (
      <div>
        <p style={{ color: '#61dafb' }}>
          { `Hello, ${this.state.name}!` }
        </p>
      </div>
    );
  }
}

export default GreetingComponent;
