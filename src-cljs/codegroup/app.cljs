(ns codegroup.app
  (:require [crate.core :as crate]
            [domina :as dm]
            [domina.css :as dmc]
            [goog.dom :as gdom]
            [clojure.browser.event :as event]))

(defn add-msg [msg-el]
  (gdom/append (dm/single-node (dmc/sel "#chatLog")) msg-el))


                
;          $('#text').keypress(function(event) {
;              if (event.keyCode == '13') {
;                send();
;              }
;          });	
(def ws-url "ws://localhost:8080/socket")
(def socket (js/WebSocket. ws-url))
(add-msg (crate/html [:p.event "Socket Status: " + (str (.-readyState socket))]))
(set! (.-onopen socket)
      #(add-msg 
         (crate/html [:p.event "Socket Status: " + (str (.-readyState socket)) + " (open)"])))

(set! (.-onmessage socket)
      (fn add-msg [msg]
         (crate/html [:p.event "Received: " + (.-data msg)])))

(defn console-loop []
  (js/alert "Send")
  (js/setTimeout console-loop 5000))

;(console-loop)

(event/listen (dm/single-node (dmc/sel "#text"))
              :keypress
              (fn [e]
                (if (= (.-keyCode e) 13)
                  (send-it))))
;          function message(msg){
;            $('#chatLog').append(msg+'</p>');
;          }
