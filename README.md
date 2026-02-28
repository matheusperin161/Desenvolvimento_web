```
  _    _             _____  _     _      
 | |  | |           |  __ \(_)   | |     
 | |  | |_ __   ___ | |__) |_  __| | ___ 
 | |  | | '_ \ / _ \|  _  /| |/ _` |/ _ \
 | |__| | | | | (_) | | \ \| | (_| |  __/
  \____/|_| |_|\___/|_|  \_\_|\__,_|\___|
                                         
                                         
```
                                        
# Desenvolvimento_web
Desenvolvimento de um site, com a funcionalidade de oferecer carona para universitários
Sua ideia já está excelente. Agora vou te ajudar a transformar isso em um **sistema mais completo, profissional e diferenciado**, como se fosse um mini Uber universitário. Vou dividir em níveis: **básico, intermediário e avançado**, para você escolher conforme o tempo.

---

Essas são as funções mínimas para funcionar bem.

## 👤 Usuário (motorista e passageiro)

* Cadastro:

  * nome
  * email
  * telefone
  * senha
* Login / Logout
* Editar perfil
* Foto do perfil

---

## 🚗 Motorista oferece carona

* Cadastrar veículo:

  * placa
  * modelo
  * cor
  * quantidade de vagas

* Cadastrar carona:

  * origem
  * destino
  * horário de saída
  * valor
  * vagas disponíveis
  * observações (ex: "ar condicionado", "não aceito pets")

---

## 🎒 Passageiro utiliza carona

* Ver lista de caronas disponíveis
* Filtrar por:

  * origem
  * destino
  * data
* Reservar vaga
* Ver dados do motorista
* Entrar em contato (telefone ou WhatsApp)

---

## Implementações futuras:

## ⭐ Sistema de avaliação

Depois da carona:

* passageiro avalia motorista
* motorista avalia passageiro

Exemplo:
⭐⭐⭐⭐⭐ (4.8)

Campos:

* nota (1 a 5)
* comentário

---

## 📍 Status da carona

* disponível
* lotada
* finalizada
* cancelada

---

## 📅 Histórico

Motorista:

* caronas oferecidas
* quem participou

Passageiro:

* caronas utilizadas

---

## 🔔 Sistema de solicitação

Em vez de entrar direto, passageiro envia solicitação:

Motorista pode:

* aceitar
* recusar

---

---

## 🔒 Verificação de estudante (diferencial universitário)

Somente alunos podem usar.

Exemplo:

* email institucional
  `@unochapeco.edu.br`

Relaciona com Unochapecó

---

## 🚻 Preferências

Motorista pode marcar:

* apenas mulheres
* aceita pets
* aceita bagagem

---

Tabelas:

* usuarios
* veiculos
* caronas
* reservas
* avaliacoes
* mensagens

---

# 🧩 Exemplo de fluxo completo

Motorista:

1 cria conta
2 cadastra veículo
3 cria carona

Passageiro:

1 cria conta
2 procura carona
3 solicita vaga
4 motorista aceita
5 viagem acontece
6 ambos avaliam

---
