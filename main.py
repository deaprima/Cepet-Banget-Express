import eel
import handlers 

eel.init('web')

if __name__ == "__main__":
    eel.start('login.html', size=(1560, 1000))
