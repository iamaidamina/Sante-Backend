const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const getCaptchaToken = (body = {}) => {
  return body.captchaToken || body.recaptchaToken || body.captcha || body.token;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip;
};

const verifyCaptcha = async (req, res, next) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.error('RECAPTCHA_SECRET_KEY no esta configurada');
    return res.status(500).json({
      message: 'Captcha no configurado en el servidor'
    });
  }

  const captchaToken = getCaptchaToken(req.body);

  if (!captchaToken) {
    return res.status(400).json({
      message: 'Captcha requerido'
    });
  }

  const params = new URLSearchParams({
    secret,
    response: captchaToken
  });

  const clientIp = getClientIp(req);
  if (clientIp) {
    params.append('remoteip', clientIp);
  }

  try {
    const verifyResponse = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!verifyResponse.ok) {
      return res.status(503).json({
        message: 'No se pudo validar el captcha en este momento'
      });
    }

    const payload = await verifyResponse.json();

    if (!payload.success) {
      return res.status(403).json({
        message: 'Captcha invalido'
      });
    }

    if (typeof payload.score === 'number') {
      const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
      if (payload.score < minScore) {
        return res.status(403).json({
          message: 'Captcha no superado'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error validando captcha:', error);
    return res.status(503).json({
      message: 'Servicio de captcha no disponible'
    });
  }
};

module.exports = verifyCaptcha;
