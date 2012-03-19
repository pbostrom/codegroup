(ns codegroup.app
  (:require [crate.core :as crate])
  (:require [domina :as dmna])
  (:require [goog.dom :as gdom])
  (:require [clojure.browser.event :as event]))

(defn add-msg [msg-el]
  (gdom/append (sel "#chatLog") msg-el))

(event/listen (sel "#text") 
              :keypress 
              (fn [e]
                (if (= (.-keyCode e) "13")
                  (send))))
                
;          $('#text').keypress(function(event) {
;              if (event.keyCode == '13') {
;                send();
;              }
;          });	
(js/alert "Hello from ClojureScript!")
(def ws-url "ws://localhost:8080/socket")
(def socket (js/WebSocket. ws-url))


;          function message(msg){
;            $('#chatLog').append(msg+'</p>');
;          }
