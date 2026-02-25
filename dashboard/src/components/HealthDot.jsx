import React from 'react';

export default function HealthDot({ status }) {
  return <span className={`health-dot ${status}`} title={status} />;
}
