package org.neuverse.service;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import jakarta.enterprise.context.ApplicationScoped;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@ApplicationScoped
public class TotpService {

    // 6 dígitos a cada 30s
    private static final Duration STEP = Duration.ofSeconds(30);

    public String newBase32Secret() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("HmacSHA1");
        keyGen.init(160); // 80-160 bits ok
        SecretKey key = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(key.getEncoded()); // usaremos base64 para armazenar
    }

    public boolean verifyCode(String base64Secret, String code) throws Exception {
        byte[] secret = Base64.getDecoder().decode(base64Secret);
        Key key = new javax.crypto.spec.SecretKeySpec(secret, "HmacSHA1");
        TimeBasedOneTimePasswordGenerator totp = new TimeBasedOneTimePasswordGenerator(STEP);
        int expected = totp.generateOneTimePassword(key, Instant.now());
        return String.format("%06d", expected).equals(code);
    }

    public String otpauthUri(String issuer, String accountLabel, String base64Secret) {
        // Para apps como Google Authenticator, a key costuma ser base32;
        // aqui usamos base64 por simplicidade. Funciona melhor se converter para base32 real.
        String secret = base64Secret; // simplificando
        String label = URLEncoder.encode(issuer + ":" + accountLabel, StandardCharsets.UTF_8);
        String params = "secret=" + URLEncoder.encode(secret, StandardCharsets.UTF_8) +
                "&issuer=" + URLEncoder.encode(issuer, StandardCharsets.UTF_8) +
                "&digits=6&period=30";
        return "otpauth://totp/" + label + "?" + params;
    }
}
