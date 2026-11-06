(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const topic = document.getElementById('contactTopic');
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  const topicOptions = {
    shipping: 'Shipping and delivery',
    return: 'Return or exchange'
  };
  if (topicOptions[requestedTopic]) topic.value = topicOptions[requestedTopic];

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const recipient = form.dataset.recipient;
    if (!recipient) {
      document.getElementById('contactMsg').textContent = 'The contact email is not configured.';
      return;
    }

    const fields = new FormData(form);
    const subject = `AURÉLLE enquiry: ${fields.get('topic')}`;
    const body = [
      `Name: ${fields.get('name')}`,
      `Reply email: ${fields.get('email')}`,
      `Topic: ${fields.get('topic')}`,
      `Order reference: ${fields.get('order') || 'Not provided'}`,
      '',
      fields.get('message')
    ].join('\n');
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById('contactMsg').textContent =
      recipient.endsWith('.example')
        ? 'Your email app should open with the message. This demo recipient is a placeholder; replace it before using the form for real support.'
        : 'Your email app should open with the message. Review it and send it there.';
    location.href = mailto;
  });
})();
