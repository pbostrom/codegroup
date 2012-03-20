(ns codegroup.app
  (:require [crate.core :as crate]
            [domina :as dm]
            [domina.css :as dmc]
            [goog.dom :as gdom]
            [clojure.browser.event :as event]))

(defn add-msg [msg-el]
  (gdom/append (sel "#chatLog") msg-el))


(event/listen (dm/single-node (dmc/sel "#text"))
              :keypress
              (fn [e]
                (if (= (.-keyCode e) 13)
                  (js/alert "Hey You"))))
                
;          $('#text').keypress(function(event) {
;              if (event.keyCode == '13') {
;                send();
;              }
;          });	
(def ws-url "ws://localhost:8080/socket")
(def socket (js/WebSocket. ws-url))


;          function message(msg){
;            $('#chatLog').append(msg+'</p>');
;          }
